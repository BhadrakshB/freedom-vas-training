import {RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { mockText } from "./mock-document-text";


async function processTextDocument(document: string) {
  try {
    var text = document;
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", " ", ""],
  });

  const output = await splitter.createDocuments([text]);

  console.log(output);
  } catch (errorCode) {

  }

}

processTextDocument(mockText);