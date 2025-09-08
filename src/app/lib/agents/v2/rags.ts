
// import { createRetrieverTool } from "langchain/tools/retriever";
// import { pineconeAdapter } from "../../pinecone";
// import { embeddings } from "./llms";


// let sopRetriever: any = null;


// export async function getSopRetriever() {
//     if (sopRetriever) return sopRetriever;
//     const pc = pineconeAdapter;
//     const indexName = process.env.PINECONE_INDEX ?? "company-sops";
//     const index = pc.getIndex(indexName);


//     sopRetriever = await PineconeStore.fromExistingIndex(embeddings as any, {
//         pineconeIndex: index,
//         textKey: "text",
//     } as any);


//     return sopRetriever;
// }


// export async function getSopTool() {
//     const retriever = await getSopRetriever();
//     const tool = createRetrieverTool(retriever, {
//     name: "sop_lookup",
//     description:
//     "Lookup company SOPs, policies, and relevant docs. Returns short relevant snippets and sources. Use to verify allowed/denied actions.",
//     });
//     return tool;
// }