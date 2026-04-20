import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

console.log('Model training worker initialized');
let _globalCtx = {};
let _model = null;

const WEIGHTS = {
    category: 0.4,
    color: 0.3,
    price: 0.2,
    age: 0.1,
}

// Normalize continuous values to [0, 1] range
// Why normalize? To prevent one feature from dominating the model due to its scale
const normalize = (value, min, max) => (value - min) / ((max - min) || 1);

function makeContext(products, users) {
    const ages = users.map(u => u.age);
    const prices = products.map(p => p.price);

    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const colors = [...new Set(products.map(p => p.color))];
    const categories = [...new Set(products.map(p => p.category))];

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
        products.map(p => {
            const avg = ageCounts[p.name] ? ageSums[p.name] / ageCounts[p.name] : midAge;

            return [p.name, normalize(avg, minAge, maxAge)];
        })
    );

    return {
        products,
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

function encodeUser(user, context) {
    if (user.purchases.length) {
        return tf.stack(
            user.purchases.map(p => encodeProduct(p, context))
        )
        .mean(0)
        .reshape([1, context.dimensions]);
    }

    return tf.concat1d([
        tf.zeros([1]), // price is ignored
        tf.tensor1d([
            normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.age
        ]),
        tf.zeros([context.numCategories]), // categories ignored
        tf.zeros([context.numColors]), // colors ignored
    ]).reshape([1, context.dimensions]);
}

function createTrainingData(context) {
    const inputs = [];
    const labels = [];
    context.users
        .filter(u => u.purchases.length)
        .forEach(user => {
            const userVector = encodeUser(user, context).dataSync();
            context.products.forEach(product => {
                const productVector = encodeProduct(product, context).dataSync();
                const label = user.purchases.some(p => p.name === product.name) ? 1 : 0;

                inputs.push([...userVector, ...productVector]);
                labels.push(label);
            });
        });

    return {
        xs: tf.tensor2d(inputs),
        ys: tf.tensor2d(labels, [labels.length, 1]),
        // length = userVector + productVector
        inputDimension: context.dimensions * 2,
    }
}

async function configureNeuralNetAndTrain(trainData) {
    const model = tf.sequential();

    model.add(
        tf.layers.dense({
            inputShape: [trainData.inputDimension],
            units: 128,
            activation: 'relu',
        })
    );

    model.add(
        tf.layers.dense({
            units: 64,
            activation: 'relu',
        })
    );

    model.add(
        tf.layers.dense({
            units: 32,
            activation: 'relu',
        })
    );

    // sigmoid reduce the result to a range between 0 and 1
    // example: 0.9 = strong recommendation, 0.1 = weak recommendation
    model.add(
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
    );

    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
    });

    await model.fit(trainData.xs, trainData.ys, {
        epochs: 100,
        batchSize: 32,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, log) => {
                console.log(`Epoch: ${epoch}, Loss: ${log.loss}, Accuracy: ${log.acc}`);

                postMessage({
                    type: workerEvents.trainingLog,
                    epoch,
                    loss: log.loss,
                    accuracy: log.acc,
                });
            },
        },
    });

    return model;
}

async function trainModel({ users }) {
    console.log('Training model with users:', users)

    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 50 } });

    const products = await (await fetch('/data/products.json')).json();
    
    const context = makeContext(products, users);
    context.productVectors = products.map(p => {
        return {
            name: p.name,
            meta: { ...p },
            vector: encodeProduct(p, context).dataSync()
        }
    });

    _globalCtx = context;

    const trainData = createTrainingData(context);
    _model = await configureNeuralNetAndTrain(trainData);

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
    if (!_model) {
        return;
    }
    const context = _globalCtx;

    console.log('will recommend for user:', user);
    const userVector = encodeUser(user, context).dataSync();

    // In real applications:
    // Store products vectors in a vector db (Postgres, Neo4j or Pinecone, for example)
    // Search: Find the 200 products closer to the user vector
    // Execute _model.predict() only on those products.

    const inputs = context.productVectors.map(({ vector }) => {
        return [...userVector, ...vector];
    });
    const inputTensor = tf.tensor2d(inputs);

    const predictions = _model.predict(inputTensor);
    const scores = predictions.dataSync();

    const recommendations = context.productVectors.map((item, index) => {
        return {
            ...item.meta,
            name: item.name,
            score: scores[index], // prediction of the model for this product
        }
    });
    const sortedItems = recommendations.sort((a, b) => b.score - a.score);

    postMessage({
        type: workerEvents.recommend,
        user,
        recommendations: sortedItems,
    });
}


const handlers = {
    [workerEvents.trainModel]: trainModel,
    [workerEvents.recommend]: d => recommend(d.user, _globalCtx),
};

self.onmessage = e => {
    const { action, ...data } = e.data;
    if (handlers[action]) handlers[action](data);
};
