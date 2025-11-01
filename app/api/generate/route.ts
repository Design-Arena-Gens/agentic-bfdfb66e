import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, tone, length, keywords } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    // Construct the prompt based on parameters
    const lengthGuide: string = ({
      short: '500-700 words',
      medium: '1000-1200 words',
      long: '2000-2500 words',
    } as Record<string, string>)[length] || '1000-1200 words'

    const keywordText = keywords && keywords.length > 0
      ? `\n\nIncorporate these keywords naturally: ${keywords.join(', ')}`
      : ''

    const prompt = `Write a comprehensive blog post on the following topic: "${topic}"

Guidelines:
- Tone: ${tone}
- Target length: ${lengthGuide}
- Create an engaging title
- Include an introduction that hooks the reader
- Use clear headings and subheadings (H2 and H3)
- Provide valuable insights and practical information
- Include examples where appropriate
- End with a strong conclusion
- Use markdown formatting${keywordText}

Write the blog post now, starting with the title on the first line (without markdown heading):
`

    // Use Claude API through Anthropic
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      // Fallback to a mock response for demo purposes
      const mockPost = generateMockBlogPost(topic, tone, length, keywords)
      return NextResponse.json(mockPost)
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate blog post')
    }

    const data = await response.json()
    const fullText = data.content[0].text

    // Extract title (first line) and content
    const lines = fullText.split('\n')
    const title = lines[0].replace(/^#\s*/, '').trim()
    const content = lines.slice(1).join('\n').trim()

    return NextResponse.json({
      title,
      content,
    })
  } catch (error: any) {
    console.error('Error generating blog post:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate blog post' },
      { status: 500 }
    )
  }
}

function generateMockBlogPost(topic: string, tone: string, length: string, keywords: string[]) {
  const title = `${topic}: A Comprehensive Guide`

  const wordCount: number = ({
    short: 500,
    medium: 1000,
    long: 2000,
  } as Record<string, number>)[length] || 1000

  const keywordText = keywords && keywords.length > 0
    ? `This post explores ${keywords.join(', ')} and more.`
    : ''

  const content = `
## Introduction

Welcome to this ${tone} exploration of ${topic}. ${keywordText}

In today's rapidly evolving landscape, understanding ${topic} has become increasingly important. This comprehensive guide will walk you through the key concepts, practical applications, and future implications of this fascinating subject.

## What is ${topic}?

${topic} represents a significant development in our modern world. It encompasses various aspects that affect how we work, live, and interact with technology and each other.

The fundamentals of ${topic} can be broken down into several key components:

- **Core Principles**: The underlying concepts that make ${topic} work
- **Practical Applications**: Real-world use cases and implementations
- **Benefits**: How ${topic} improves existing processes or creates new opportunities
- **Challenges**: Current limitations and areas for improvement

## Key Benefits

Understanding ${topic} offers numerous advantages:

1. **Enhanced Efficiency**: Streamlines processes and reduces manual effort
2. **Cost Savings**: Optimizes resource allocation and reduces waste
3. **Innovation**: Opens up new possibilities and creative solutions
4. **Competitive Advantage**: Helps organizations stay ahead in their field

## Best Practices

When implementing ${topic}, consider these proven strategies:

### Planning Phase
Start with a clear vision and well-defined goals. Research existing solutions and identify gaps that need to be addressed.

### Implementation
Take an iterative approach, starting small and scaling gradually. Monitor progress closely and adjust based on feedback.

### Optimization
Continuously refine your approach based on data and results. Stay updated with the latest developments and innovations in the field.

## Common Challenges

While ${topic} offers many benefits, it's important to be aware of potential obstacles:

- **Learning Curve**: Initial adoption may require training and adjustment
- **Resource Requirements**: Implementation often needs investment in time and resources
- **Integration**: Connecting with existing systems can be complex
- **Change Management**: Organizational resistance to new approaches

## Future Outlook

The future of ${topic} looks promising, with ongoing developments in related technologies and methodologies. Experts predict continued growth and evolution, making now an ideal time to get involved.

## Conclusion

${topic} represents an important area of focus in our modern world. By understanding its principles, benefits, and best practices, you can leverage it effectively for your needs.

Whether you're just starting out or looking to deepen your expertise, the key is to stay curious, keep learning, and apply these concepts in practical ways. The journey of mastering ${topic} is ongoing, but the rewards are well worth the effort.

${wordCount > 1000 ? `\n## Additional Resources\n\nTo further your understanding of ${topic}, consider exploring:\n\n- Industry publications and journals\n- Online courses and certifications\n- Community forums and discussion groups\n- Case studies and white papers\n- Conferences and networking events\n\n## Frequently Asked Questions\n\n**Q: How long does it take to see results?**\nA: Results vary depending on your specific situation, but many see initial benefits within the first few weeks of implementation.\n\n**Q: Is this suitable for beginners?**\nA: Absolutely! While there is a learning curve, the principles of ${topic} can be understood and applied by people at all skill levels.\n\n**Q: What resources do I need to get started?**\nA: The basic requirements are minimal. Start with research and education, then gradually invest in tools and resources as needed.` : ''}
`

  return { title, content: content.trim() }
}
