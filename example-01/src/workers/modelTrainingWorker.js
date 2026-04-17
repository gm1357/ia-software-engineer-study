import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

console.log('Model training worker initialized');
let _globalCtx = {};

const WEIGHTS = {
    category: 0.4,
    color: 0.3,
    price: 0.2,
    age: 0.1,
}

// Normalize continuous values to [0, 1] range
// Why normalize? To prevent one feature from dominating the model due to its scale
const normalize = (value, min, max) => (value - min) / ((max - min) || 1);

function makeContext(catalog, users) {
    const ages = users.map(u => u.age);
    const prices = catalog.map(p => p.price);

    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const colors = [...new Set(catalog.map(p => p.color))];
    const categories = [...new Set(catalog.map(p => p.category))];

    const colorsIndex = Object.fromEntries(
        colors.map((color, index) => [color, index])
    );
    const categoriesIndex = Object.fromEntries(
        categories.map((category, index) => [category, index])
    );
    
    
    const midAge = (minAge + maxAge) / 2;
    const ageSums = {};
    const ageCounts = {};

    users.forEach(user => {
        user.purchases.forEach(purchase => {
            ageSums[purchase.name] = (ageSums[purchase.name] || 0) + user.age;
            ageCounts[purchase.name] = (ageCounts[purchase.name] || 0) + 1;
        });
    });

    const productAverageAgeNorm = Object.fromEntries(
        catalog.map(p => {
            const avg = ageCounts[p.name] ? ageSums[p.name] / ageCounts[p.name] : midAge;

            return [p.name, normalize(avg, minAge, maxAge)];
        })
    );

    return {
        catalog,
        users,
        colorsIndex,
        categoriesIndex,
        minAge,
        maxAge,
        minPrice,
        maxPrice,
        numCategories: categories.length,
        numColors: colors.length,
        // age, price, one-hot encoded category, one-hot encoded color
        dimensions: 2 + categories.length + colors.length,
        productAverageAgeNorm,
    }
}

const oneHotWeighted = (index, length, weight) =>
    tf.oneHot(index, length).cast('float32').mul(weight);

function encodeProduct(product, context) {
    const price = tf.tensor1d([
        normalize(product.price, context.minPrice, context.maxPrice) * WEIGHTS.price
    ]);

    const age = tf.tensor1d([
        (
            context.productAverageAgeNorm[product.name] ?? 0.5
        ) * WEIGHTS.age
    ]);

    const category = oneHotWeighted(
        context.categoriesIndex[product.category],
        context.numCategories,
        WEIGHTS.category
    );

    const color = oneHotWeighted(
        context.colorsIndex[product.color],
        context.numColors,
        WEIGHTS.color
    );

    return tf.concat1d([price, age, category, color]);
}

async function trainModel({ users }) {
    console.log('Training model with users:', users)

    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 50 } });

    const catalog = await (await fetch('/data/products.json')).json();
    
    const context = makeContext(catalog, users);
    context.productVectors = catalog.map(p => {
        return {
            name: p.name,
            meta: { ...p },
            vector: encodeProduct(p, context).dataSync()
        }
    });

    _globalCtx = context;

    postMessage({
        type: workerEvents.trainingLog,
        epoch: 1,
        loss: 1,
        accuracy: 1
    });

    setTimeout(() => {
        postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
        postMessage({ type: workerEvents.trainingComplete });
    }, 1000);


}
function recommend(user, ctx) {
    console.log('will recommend for user:', user)
    // postMessage({
    //     type: workerEvents.recommend,
    //     user,
    //     recommendations: []
    // });
}


const handlers = {
    [workerEvents.trainModel]: trainModel,
    [workerEvents.recommend]: d => recommend(d.user, _globalCtx),
};

self.onmessage = e => {
    const { action, ...data } = e.data;
    if (handlers[action]) handlers[action](data);
};
