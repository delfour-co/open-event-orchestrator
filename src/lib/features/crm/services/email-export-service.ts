/**
 * Email Export Service
 *
 * Converts email document to responsive HTML for email clients.
 */

import type {
  ButtonBlock,
  ColumnsBlock,
  DividerBlock,
  EmailBlock,
  EmailDocument,
  ImageBlock,
  TextBlock
} from '../domain/email-editor'
import { getColumnWidths } from '../domain/email-editor'

/**
 * Export email document to HTML
 */
export function exportToHtml(document: EmailDocument): string {
  const { globalStyles, blocks } = document

  const blocksHtml = blocks.map((block) => renderBlock(block, globalStyles)).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
    }
    /* Responsive styles */
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .responsive-table {
        width: 100% !important;
      }
      .mobile-full-width {
        width: 100% !important;
        display: block !important;
      }
      .mobile-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      .mobile-stack {
        display: block !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${globalStyles.backgroundColor}; font-family: ${globalStyles.fontFamily};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${globalStyles.backgroundColor};">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="${globalStyles.contentWidth}" class="email-container" style="max-width: ${globalStyles.contentWidth}px; background-color: #ffffff;">
${blocksHtml}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Render a single block to HTML
 */
function renderBlock(block: EmailBlock, globalStyles: EmailDocument['globalStyles']): string {
  switch (block.type) {
    case 'text':
      return renderTextBlock(block)
    case 'image':
      return renderImageBlock(block, globalStyles)
    case 'button':
      return renderButtonBlock(block)
    case 'divider':
      return renderDividerBlock(block)
    case 'columns':
      return renderColumnsBlock(block, globalStyles)
    default:
      return ''
  }
}

/**
 * Render text block
 */
function renderTextBlock(block: TextBlock): string {
  const padding = `${block.padding.top}px ${block.padding.right}px ${block.padding.bottom}px ${block.padding.left}px`

  return `          <tr>
            <td style="padding: ${padding}; background-color: ${block.backgroundColor};">
              <div style="font-size: ${block.fontSize}px; font-weight: ${block.fontWeight}; color: ${block.color}; line-height: ${block.lineHeight}; text-align: ${block.textAlign};">
                ${block.content}
              </div>
            </td>
          </tr>`
}

/**
 * Render image block
 */
function renderImageBlock(block: ImageBlock, globalStyles: EmailDocument['globalStyles']): string {
  const padding = `${block.padding.top}px ${block.padding.right}px ${block.padding.bottom}px ${block.padding.left}px`

  let widthStyle = ''
  let widthAttr = ''

  switch (block.width) {
    case 'full':
      widthStyle = 'width: 100%;'
      widthAttr = `width="${globalStyles.contentWidth}"`
      break
    case '75%':
      widthStyle = 'width: 75%;'
      widthAttr = `width="${Math.round(globalStyles.contentWidth * 0.75)}"`
      break
    case '50%':
      widthStyle = 'width: 50%;'
      widthAttr = `width="${Math.round(globalStyles.contentWidth * 0.5)}"`
      break
    case 'auto':
      widthStyle = 'width: auto; max-width: 100%;'
      break
  }

  const imgHtml = block.src
    ? `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" ${widthAttr} style="${widthStyle} height: auto; display: block; margin: 0 auto;">`
    : `<div style="background-color: #e5e7eb; height: 150px; display: flex; align-items: center; justify-content: center; color: #6b7280;">No image selected</div>`

  const linkedImg = block.linkUrl
    ? `<a href="${escapeHtml(block.linkUrl)}" target="_blank">${imgHtml}</a>`
    : imgHtml

  return `          <tr>
            <td align="${block.align}" style="padding: ${padding}; background-color: ${block.backgroundColor};">
              ${linkedImg}
            </td>
          </tr>`
}

/**
 * Render button block
 */
function renderButtonBlock(block: ButtonBlock): string {
  const padding = `${block.padding.top}px ${block.padding.right}px ${block.padding.bottom}px ${block.padding.left}px`

  let buttonStyle = ''

  if (block.style === 'filled') {
    buttonStyle = `background-color: ${block.backgroundColor}; color: ${block.textColor}; border: none;`
  } else if (block.style === 'outline') {
    buttonStyle = `background-color: transparent; color: ${block.backgroundColor}; border: 2px solid ${block.backgroundColor};`
  } else {
    buttonStyle = `background-color: transparent; color: ${block.backgroundColor}; border: none;`
  }

  const buttonWidth = block.fullWidth ? 'width: 100%;' : ''

  return `          <tr>
            <td align="${block.align}" style="padding: ${padding}; background-color: ${block.backgroundColor === 'transparent' ? 'transparent' : block.backgroundColor};">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(block.url)}" style="height:45px;v-text-anchor:middle;${buttonWidth}" arcsize="${Math.round((block.borderRadius / 45) * 100)}%" stroke="f" fillcolor="${block.style === 'filled' ? block.backgroundColor : 'transparent'}">
                <w:anchorlock/>
                <center style="color:${block.textColor};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">${escapeHtml(block.text)}</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="${escapeHtml(block.url)}" target="_blank" style="display: inline-block; ${buttonStyle} ${buttonWidth} padding: 12px 24px; border-radius: ${block.borderRadius}px; text-decoration: none; font-weight: bold; font-size: 14px; text-align: center; box-sizing: border-box;">
                ${escapeHtml(block.text)}
              </a>
              <!--<![endif]-->
            </td>
          </tr>`
}

/**
 * Render divider block
 */
function renderDividerBlock(block: DividerBlock): string {
  const padding = `${block.padding.top}px ${block.padding.right}px ${block.padding.bottom}px ${block.padding.left}px`

  let widthPercent = '100%'
  switch (block.width) {
    case '75%':
      widthPercent = '75%'
      break
    case '50%':
      widthPercent = '50%'
      break
    case '25%':
      widthPercent = '25%'
      break
  }

  return `          <tr>
            <td align="center" style="padding: ${padding}; background-color: ${block.backgroundColor};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="${widthPercent}">
                <tr>
                  <td style="border-top: ${block.thickness}px ${block.style} ${block.color};"></td>
                </tr>
              </table>
            </td>
          </tr>`
}

/**
 * Render columns block
 */
function renderColumnsBlock(
  block: ColumnsBlock,
  globalStyles: EmailDocument['globalStyles']
): string {
  const padding = `${block.padding.top}px ${block.padding.right}px ${block.padding.bottom}px ${block.padding.left}px`
  const widths = getColumnWidths(block.layout)

  const columnsHtml = block.columns
    .map((col, index) => {
      const colWidth = widths[index]
      const blocksHtml = col.blocks.map((b) => renderBlock(b, globalStyles)).join('\n')

      return `              <!--[if mso]>
              <td width="${Math.round(colWidth)}%" valign="top" class="mobile-stack">
              <![endif]-->
              <!--[if !mso]><!-->
              <td width="${colWidth}%" valign="top" class="mobile-stack" style="display: inline-block; vertical-align: top;">
              <!--<![endif]-->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
${blocksHtml || '                  <tr><td>&nbsp;</td></tr>'}
                </table>
              </td>
              <!--[if mso]>
              <td width="${block.gap}" style="font-size: 0;">&nbsp;</td>
              <![endif]-->`
    })
    .join('\n')

  return `          <tr>
            <td style="padding: ${padding}; background-color: ${block.backgroundColor};">
              <!--[if mso]>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
              <![endif]-->
              <table role="presentation" cellspacing="${block.gap}" cellpadding="0" border="0" width="100%">
                <tr>
${columnsHtml}
                </tr>
              </table>
              <!--[if mso]>
                </tr>
              </table>
              <![endif]-->
            </td>
          </tr>`
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }

  return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char)
}

/**
 * Generate plain text version from HTML
 */
export function generatePlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
