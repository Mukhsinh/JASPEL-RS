// PDF Guide Generator temporarily disabled for build compatibility
export class SystemGuideGenerator {
  public async generateSystemGuide(): Promise<Buffer> {
    throw new Error("PDF guide generation sementara dinonaktifkan")
  }
}

// Export function for backward compatibility
export async function generateSystemGuide(): Promise<Buffer> {
  const generator = new SystemGuideGenerator()
  return await generator.generateSystemGuide()
}
