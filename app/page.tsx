'use client'

import { useState } from 'react'
import { marked } from 'marked'

interface BlogPost {
  title: string
  content: string
  timestamp: number
}

export default function Home() {
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('professional')
  const [length, setLength] = useState('medium')
  const [keywords, setKeywords] = useState('')
  const [loading, setLoading] = useState(false)
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<BlogPost[]>([])

  const generateBlog = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          tone,
          length,
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate blog post')
      }

      const newPost = {
        title: data.title,
        content: data.content,
        timestamp: Date.now(),
      }

      setBlogPost(newPost)
      setHistory(prev => [newPost, ...prev.slice(0, 9)])
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const downloadBlog = () => {
    if (!blogPost) return

    const markdown = `# ${blogPost.title}\n\n${blogPost.content}`
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${blogPost.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async () => {
    if (!blogPost) return

    try {
      await navigator.clipboard.writeText(`# ${blogPost.title}\n\n${blogPost.content}`)
      alert('Copied to clipboard!')
    } catch (err) {
      alert('Failed to copy')
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Blog Writing Agent
          </h1>
          <p className="text-xl text-gray-600">AI-Powered Blog Generation & Automation</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-2xl font-bold mb-6">Generate Blog Post</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Topic *</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., The Future of AI"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="academic">Academic</option>
                    <option value="conversational">Conversational</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Length</label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="short">Short (~500 words)</option>
                    <option value="medium">Medium (~1000 words)</option>
                    <option value="long">Long (~2000 words)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g., machine learning, automation"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={generateBlog}
                  disabled={loading || !topic.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Generating...' : 'Generate Blog Post'}
                </button>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
              </div>

              {history.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-3">Recent Posts</h3>
                  <div className="space-y-2">
                    {history.map((post, idx) => (
                      <button
                        key={idx}
                        onClick={() => setBlogPost(post)}
                        className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                      >
                        <div className="font-medium truncate">{post.title}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(post.timestamp).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Blog Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              {blogPost ? (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-3xl font-bold">{blogPost.title}</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                      >
                        Copy
                      </button>
                      <button
                        onClick={downloadBlog}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <div
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: marked(blogPost.content) as string }}
                  />
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">✍️</div>
                  <h3 className="text-2xl font-semibold mb-2">No Blog Post Yet</h3>
                  <p className="text-gray-600">
                    Enter a topic and click "Generate Blog Post" to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
