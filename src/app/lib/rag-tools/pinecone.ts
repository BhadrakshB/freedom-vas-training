import { Pinecone, Index } from "@pinecone-database/pinecone";

// Adapter Pattern for Pinecone Service
class PineconeServiceAdapter {
  private client: Pinecone;

  constructor(apiKey: string, ) {
    this.client = new Pinecone({ apiKey });
  }

  // ---------------------- Index Management ----------------------
  async listIndexes() {
    return await this.client.listIndexes();
  }

  async createIndex(
    name: string,
    dimension: number,
    metric: "cosine" | "euclidean" | "dotproduct",
    spec: any,
    deletionProtection: "enabled" | "disabled",
    tags: Record<string, string> = {}
  ) {
    return await this.client.createIndex({
      name,
      dimension,
      metric,
      spec,
      deletionProtection,
      tags,
    });
  }

  async describeIndex(name: string) {
    return await this.client.describeIndex(name);
  }

  async configureIndex(
    name: string,
    embedConfig?: any,
    deletionProtection?: "enabled" | "disabled",
    tags?: Record<string, string>
  ) {
    return await this.client.configureIndex(name, {
      embed: embedConfig,
      deletionProtection,
      tags,
    });
  }

  async deleteIndex(name: string) {
    return await this.client.deleteIndex(name);
  }

  // ---------------------- Vector Operations ----------------------
  private getIndex(indexName: string): Index {
    return this.client.index(indexName);
  }

  async upsertVectors(indexName: string, vectors: any[], namespace?: string) {
    const index = this.getIndex(indexName);
    return await index.upsert(vectors);
  }

  async queryVectors(
    indexName: string,
    vector: number[],
    topK: number,
    filter?: object,
    includeMetadata: boolean = false,
    namespace?: string
  ) {
    const index = this.getIndex(indexName);
    return await index.query({
      vector,
      topK,
      filter,
      includeMetadata,
    });
  }

  async describeIndexStats(indexName: string) {
    const index = this.getIndex(indexName);
    return await index.describeIndexStats();
  }

  // async importFromStorage(indexName: string, storageConfig: any) {
  //   const index = this.getIndex(indexName);
  //   return await index.import(storageConfig);
  // }

  // ---------------------- Inference Integration ----------------------
  async configureEmbedding(indexName: string, model: string, fieldMap: any) {
    return await this.configureIndex(indexName, { model, fieldMap });
  }

  // async embedText(text: string) {
  //   return await this.client.inference.embed({ input: text });
  // }

  // async rerankResults(results: any[]) {
  //   return await this.client.inference.rerank({ input: results });
  // }

  // async upsertWithEmbeddedRecords(indexName: string, records: any[]) {
  //   return await this.client.inference.upsert(indexName, records);
  // }

  // async searchWithEmbeddedRecords(indexName: string, query: string, topK: number) {
  //   return await this.client.inference.search(indexName, { query, topK });
  // }

  // ---------------------- Backups ----------------------
  // async listBackups(indexName: string) {
  //   return await this.client.listBackups(indexName);
  // }

  // async createBackup(indexName: string, backupName: string) {
  //   return await this.client.createBackup(indexName, backupName);
  // }

  // async restoreFromBackup(backupId: string, newIndexName: string) {
  //   return await this.client.restoreFromBackup(backupId, newIndexName);
  // }

  // ---------------------- Namespaces ----------------------
  // async queryAcrossNamespaces(
  //   indexName: string,
  //   vector: number[],
  //   namespaces: string[],
  //   topK: number
  // ) {
  //   return await this.client.queryNamespaces(indexName, {
  //     vector,
  //     namespaces,
  //     topK,
  //   });
  // }

  // ---------------------- Admin ----------------------
  // async listAPIKeys() {
  //   return await this.client.listApiKeys();
  // }

  // async createAPIKey(name: string, roles: string[]) {
  //   return await this.client.createApiKey({ name, roles });
  // }

  // async deleteAPIKey(keyId: string) {
  //   return await this.client.deleteApiKey(keyId);
  // }

  // async updateAPIKey(keyId: string, name?: string, roles?: string[]) {
  //   return await this.client.updateApiKey(keyId, { name, roles });
  // }

  // async listProjects() {
  //   return await this.client.listProjects();
  // }

  // async createProject(name: string, config: any) {
  //   return await this.client.createProject({ name, config });
  // }

  // async deleteProject(projectId: string) {
  //   return await this.client.deleteProject(projectId);
  // }
}


export var pineconeAdapter = new PineconeServiceAdapter(process.env.PINECONE_API_KEY!);