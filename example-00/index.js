import tf from "@tensorflow/tfjs-node";

async function trainModel(inputXs, outputYs) {
  const model = tf.sequential();

  // first network layer
  // input of 7 positions (normalized age + 3 colors + 3 localizations)
  // 80 neurons. The more neurons, the network can learn more complexity and will use more processing.
  // ReLU act as a filter: If the information that got to this neuron is positive, it passes, otherwise is discarted.
  model.add(
    tf.layers.dense({ inputShape: [7], units: 80, activation: "relu" }),
  );

  // output: 3 neurons
  // one for each category (premium, medium, basic)
  // activation: softmax normalizes the output as probabilities.
  model.add(tf.layers.dense({ units: 3, activation: "softmax" }));

  // optimizer Adam (Adaptative Moment Estimation)
  // tweak the weights in a smart and efficient manner
  // learn with the history of mistakes and successes.
  // loss: categoricalCrossentropy
  // compares what the model "guess" (the scores of each category)
  // with the correct answer.
  // metrics: ["accuracy"]
  // The more distant the model prediction from the right answer, bigger the error (loss).
  // Examples: images classification, recommendation, user categorization.
  // Anything in which the correct answer is "one among many possibilities"
  model.compile({
    optimizer: "adam",
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  // model training
  // epochs: number of times that will run over the dataset
  await model.fit(inputXs, outputYs, {
    verbose: 0,
    epochs: 100,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, log) =>
        console.log(`Epoch: ${epoch}. Loss: ${log.loss}`),
    },
  });

  return model;
}

// Exemplo de pessoas para treino (cada pessoa com idade, cor e localização)
// const pessoas = [
//     { nome: "Erick", idade: 30, cor: "azul", localizacao: "São Paulo" },
//     { nome: "Ana", idade: 25, cor: "vermelho", localizacao: "Rio" },
//     { nome: "Carlos", idade: 40, cor: "verde", localizacao: "Curitiba" }
// ];

// Vetores de entrada com valores já normalizados e one-hot encoded
// Ordem: [idade_normalizada, azul, vermelho, verde, São Paulo, Rio, Curitiba]
// const tensorPessoas = [
//     [0.33, 1, 0, 0, 1, 0, 0], // Erick
//     [0, 0, 1, 0, 0, 1, 0],    // Ana
//     [1, 0, 0, 1, 0, 0, 1]     // Carlos
// ]

// Usamos apenas os dados numéricos, como a rede neural só entende números.
// tensorPessoasNormalizado corresponde ao dataset de entrada do modelo.
const tensorPessoasNormalizado = [
  [0.33, 1, 0, 0, 1, 0, 0], // Erick
  [0, 0, 1, 0, 0, 1, 0], // Ana
  [1, 0, 0, 1, 0, 0, 1], // Carlos
];

// Labels das categorias a serem previstas (one-hot encoded)
// [premium, medium, basic]
const labelsNomes = ["premium", "medium", "basic"]; // Ordem dos labels
const tensorLabels = [
  [1, 0, 0], // premium - Erick
  [0, 1, 0], // medium - Ana
  [0, 0, 1], // basic - Carlos
];

// Criamos tensores de entrada (xs) e saída (ys) para treinar o modelo
const inputXs = tf.tensor2d(tensorPessoasNormalizado);
const outputYs = tf.tensor2d(tensorLabels);

const model = trainModel(inputXs, outputYs);
