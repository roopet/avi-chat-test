import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import { Configuration, OpenAIApi } from 'openai'
import { PineconeClient } from "@pinecone-database/pinecone";
//import mappings from './mapping.json' assert { type: 'json' };
//import mappings from './mapping.json';

const mappings = await import('./mapping.json', {
  assert: { type: 'json' }
});

dotenv.config()



const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);
/*
const pinecone = new PineconeClient();
await pinecone.init({
  environment: "us-east1-gcp",
  apiKey: "1d8d56c8-742f-497f-9468-15450c26b832",
});
//console.log(pinecone)
const indexesList = await pinecone.listIndexes();
console.log(indexesList.data);
const index = pinecone.Index("avi-chatgpt-test2")
*/
/*
const queryResponse = await index.query({
  query: {
  //  vector: [0.1, 0.2, 0.3, 0.4],
    topK: 10,
    includeValues: true,
    includeMetadata: true 
  },
  namespace: "avi-chatgpt-test2",
})
*/
//console.log(index)

//const mappings = require('./mapping.json')
const pinecone = new PineconeClient();

async function loadIndex() {
  await pinecone.init({
    apiKey: '1d8d56c8-742f-497f-9468-15450c26b832',
    environment: 'us-east1-gcp',
  })

  const indexName = 'avi-chatgpt-test2'
/*
  if (!pinecone.listIndexes().includes(indexName)) {
    throw new Error(`Index '${indexName}' does not exist.`)
  }
*/
  return pinecone.Index(indexName)
}

const index = await loadIndex()
//console.log(index)

async function getEmbedding(text, model = "text-embedding-ada-002") {
  text = text.replace(/\n/g, " ");
  console.log(text)
  const response = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: text
  });
 //console.log(response)
 // console.log(response.data)
  console.log(response.data.data[0])
  return response.data.data[0].embedding;
}

const exampleQuestion = "Kuinka voin hakea eläinkuljetuslupaa"

async function createContext(exampleQuestion, index, maxLen = 3750, size = 'ada') {
  
  const qEmbed = await getEmbedding(exampleQuestion, { model: `text-embedding-ada-002` })
  
  const res = await index.query({ vector: qEmbed, top_k: 5, include_metadata: true })

  //xq = openai.Embedding.create(input=query, engine=MODEL)['data'][0]['embedding']
  //res = index.query([xq], top_k=5, include_metadata=True)

  let curLen = 0
  const contexts = []
//console.log(res.data.matches[0])
  for (const row of res.data.matches) {
    console.log(row.score)
    const text = mappings[row.id] + " HTML: "+ row.metadata.html
    curLen += row.metadata.n_tokens + 4
    if (curLen < maxLen) {
      contexts.push(text)
    } else {
      curLen -= row.metadata.n_tokens + 4
      if (maxLen - curLen < 200) {
        break
      }
    }
  }

  return contexts.join('\n\n###\n\n')
}

const instructions = {
  "second": "Olet yställinen aluehallintoviraston chat-asiakaspalvelija. Vastaa esitettyyn kysymykseen perustuen alla olevaan kontekstiin. Jos et osaa täydellä varmuudella vastata kysymykseen kontekstin perusteella, pahoittele asiaa ja kehoita kääntymään asiakaspalvelun puoleen osoitteessa https://avi.fi/asiakaspalvelu.\n\nKonteksti: {0}\n\n---\n\nKysymys: {1}\nVastaus: \n\nMikäli tiedät vastauksen, kerro se ja anna HTML-linkki sivulle, josta tieto on peräisin. Linkin tulee olla peräisin kontekstista. Anna lisäksi erittäin konservatiivinen arvio siitä, kuinka todennäköisenä pidät sitä, että vastaus on oikea."
}

async function answerQuestion({
  index = index,
  fineTunedQAModel = "text-davinci-002",
  question = "Milloin tarvitsen eläinkuljettajaluvan? Miltä HTML-sivulta löydän tiedon?",
  instruction = instructions["second"],
  size = "ada",
  debug = false,
  maxLen = 3550,
  maxTokens = 500,
  stopSequence = null
}) {
  // Answer a question based on the most similar context from the dataframe texts
  const context = await createContext(question, index, {maxLen, size});

  if (debug) {
    console.log("Context:\n" + context);
    console.log("\n\n");
  }

  try {
    pololplplplplplplp
    // fine-tuned models require "model" parameter, whereas other models require "engine" parameter
    const modelParam = (
      fineTunedQAModel.includes(":") &&
      fineTunedQAModel.split(":")[1].startsWith("ft")
    ) ? {"model": fineTunedQAModel} : {"engine": fineTunedQAModel};

    const openaiResponse = await openai.complete({
      engine: null,
      prompt: instruction.replace("{0}", context).replace("{1}", question),
      maxTokens,
      temperature: 0,
      n: 1,
      stop: stopSequence,
      ...modelParam
    });

    

    return openaiResponse.choices[0].text.trim();
  } catch (error) {
    console.error(error);
    return "";
  }
}


const app = express()
app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from CodeX!'
  })
})



app.post('/', async (req, res) => {
  const question = req.body.prompt;
  
 // const context = await createContext(question, index, {maxLen:3750, size:"ada"});
  const context = await createContext(question, index);

  

  try {
  /*  
    const prompt = req.body.prompt;

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: 0, // Higher values means the model will take more risks.
      max_tokens: 3000, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
      top_p: 1, // alternative to sampling with temperature, called nucleus sampling
      frequency_penalty: 0.5, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
      presence_penalty: 0, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
    });
*/
const fineTunedQAModel = "text-davinci-002"

const modelParam = (
  fineTunedQAModel.includes(":") &&
  fineTunedQAModel.split(":")[1].startsWith("ft")
) ? {"model": fineTunedQAModel} : {"engine": fineTunedQAModel};

//guguguguguguguguggugu
//console.log(instructions["second"].replace("{0}", context).replace("{1}", question))
//console.log(modelParam)

const response = await openai.createCompletion({
//  model: "text-davinci-002", // tämä miettii loputtoman ajan
  model: "text-davinci-003", // tämäkin miettii loputtoman ajan
//  engine: "text-davinci-003", // tämä antaa 400 errorin
//  engine: "text-davinci-002",
  prompt: instructions["second"].replace("{0}", context).replace("{1}", question),
  max_tokens:400,
  top_p: 1,
  frequency_penalty: 0.0,
  presence_penalty: 0.0,
//  stop: ["\n"],
//  ...modelParam
});


//return openaiResponse.choices[0].text.trim();
//console.log(response.data.choices)
//console.log(response.data.choices[0].text)
//console.log(response.data.choices[0].text.trim())
function addLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
}
console.log(response.data.choices[0].text)
    res.status(200).send({
      bot: response.data.choices[0].text//.trim()
    });

  } catch (error) {
    console.error(error)
    res.status(500).send(error || 'Something went wrong');
  }
})

app.listen(5000, () => console.log('AI server started on http://localhost:5000'))