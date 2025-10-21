import fs from 'fs'
import { downloadContentFromMessage, proto } from '@whiskeysockets/baileys'

/**
 * Export all group members to a .vcf file
 */
export async function handleExportVcf(sock, m) {
  const from = m.key.remoteJid

  // Only works in groups
  if (!from.endsWith('@g.us')) {
    await sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: m })
    return
  }

  // Fetch group metadata
  const metadata = await sock.groupMetadata(from)
  const participants = metadata.participants

  // Build VCF data
  let vcf = ''
  for (const p of participants) {
    const jid = p.id
    const phone = jid.split('@')[0]
    vcf += `BEGIN:VCARD\nVERSION:3.0\nFN:WA ${phone}\nTEL;type=CELL;type=VOICE;waid=${phone}:+${phone}\nEND:VCARD\n`
  }

  // Save locally
  const filePath = `./group_${metadata.subject.replace(/[^\w\s]/gi, '')}_contacts.vcf`
  fs.writeFileSync(filePath, vcf, 'utf-8')

  // Send file back
  await sock.sendMessage(from, {
    document: fs.readFileSync(filePath),
    mimetype: 'text/vcard',
    fileName: `${metadata.subject}.vcf`
  }, { quoted: m })

  // Optional: cleanup file
  fs.unlinkSync(filePath)
}
