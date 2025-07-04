const { defineConfig } = require('vite')
const { readdir, readFile, stat } = require('fs/promises')
const { join } = require('path')
const fs = require('fs')

module.exports = defineConfig({
  plugins: [
    {
      name: 'markdown-api',
      configureServer(server) {
        server.middlewares.use('/api/policies', async (req, res) => {
          res.setHeader('Content-Type', 'application/json')
          
          try {
            const policiesDir = join(__dirname, 'app/policies')
            const files = await readdir(policiesDir)
            const markdownFiles = files.filter(file => file.endsWith('.md'))
            
            if (req.url === '/' || req.url === '') {
              // Return list of all policies
              const policies = []
              
              for (const file of markdownFiles) {
                const version = file.replace('.md', '')
                const filePath = join(policiesDir, file)
                const stats = await stat(filePath)
                const content = await readFile(filePath, 'utf-8')
                
                policies.push({
                  version,
                  content: content.split('\n')[0], // First line for preview
                  lastModified: stats.mtime
                })
              }
              
              res.end(JSON.stringify(policies))
            } else {
              // Return specific policy
              const version = req.url.slice(1) // Remove leading slash
              const filePath = join(policiesDir, `${version}.md`)
              
              try {
                const stats = await stat(filePath)
                const content = await readFile(filePath, 'utf-8')
                
                res.end(JSON.stringify({
                  version,
                  content,
                  lastModified: stats.mtime
                }))
              } catch (error) {
                res.statusCode = 404
                res.end(JSON.stringify({ error: 'Policy not found' }))
              }
            }
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Internal server error' }))
          }
        })
      }
    },
    {
      name: 'static-policies',
      async writeBundle() {
        // This runs during build time
        try {
          const policiesDir = join(__dirname, 'app/policies')
          const distDir = join(__dirname, 'dist')
          const files = await readdir(policiesDir)
          const markdownFiles = files.filter(file => file.endsWith('.md'))
          
          // Create policies data file
          const policies = []
          for (const file of markdownFiles) {
            const version = file.replace('.md', '')
            const filePath = join(policiesDir, file)
            const stats = await stat(filePath)
            const content = await readFile(filePath, 'utf-8')
            
            policies.push({
              version,
              content,
              lastModified: stats.mtime
            })
          }
          
          // Write policies data to dist
          const policiesDataPath = join(distDir, 'policies-data.json')
          fs.writeFileSync(policiesDataPath, JSON.stringify(policies, null, 2))
          
          console.log(`✅ Built ${policies.length} policies for static hosting`)
        } catch (error) {
          console.error('Error building policies:', error)
        }
      }
    }
  ]
}) 