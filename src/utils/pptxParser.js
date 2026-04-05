import JSZip from 'jszip'

/**
 * Parse a PPTX file and extract text from each slide.
 * Returns an array of { slideNumber, text } objects.
 */
export async function parsePPTX(file) {
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  // Collect slide XML files sorted by slide number
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0])
      const numB = parseInt(b.match(/\d+/)[0])
      return numA - numB
    })

  if (slideFiles.length === 0) {
    throw new Error('No slides found in this file. Make sure it is a valid .pptx file.')
  }

  const slides = []
  for (let i = 0; i < slideFiles.length; i++) {
    const xmlContent = await zip.files[slideFiles[i]].async('text')
    const text = extractTextFromXML(xmlContent)
    slides.push({ slideNumber: i + 1, text })
  }

  return slides
}

function extractTextFromXML(xml) {
  // Extract all <a:t> tag contents (paragraph text runs)
  const matches = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)]
  const texts = matches
    .map(m => m[1].trim())
    .filter(t => t.length > 0)

  // Group into "paragraphs" by looking at <a:p> boundaries
  // For simplicity, join with spaces; consecutive newlines come from slide titles
  return texts.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Produce a condensed summary string for all slides, suitable for
 * sending to Claude without blowing the context window.
 * Truncates per-slide text if very long.
 */
export function summarizeSlides(slides, maxCharsPerSlide = 400) {
  return slides
    .map(s => {
      const truncated = s.text.length > maxCharsPerSlide
        ? s.text.slice(0, maxCharsPerSlide) + '…'
        : s.text
      return `Slide ${s.slideNumber}: ${truncated || '(no text)'}`
    })
    .join('\n')
}
