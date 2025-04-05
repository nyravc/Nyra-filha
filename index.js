
const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const P = require('pino')
const { exec } = require('child_process')

const { state, saveState } = useSingleFileAuthState('./auth_info.json')

async function startBot() {
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    })

    sock.ev.on('creds.update', saveState)

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return

        const from = msg.key.remoteJid
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || ''

        if (body.startsWith('!ping')) {
            await sock.sendMessage(from, { text: 'pong!' })
        } else if (body.startsWith('!menu')) {
            await sock.sendMessage(from, { text: 'Comandos disponíveis:
!menu
!ping
!ajuda
!stucker
!regras
!ban' })
        } else if (body.startsWith('!ajuda')) {
            await sock.sendMessage(from, { text: 'Sou a Nyra filha. Meus comandos começam com "!" e funciono apenas em grupos.' })
        } else if (body.startsWith('!regras')) {
            await sock.sendMessage(from, { text: '1. Respeite todos
2. Sem spam
3. Nada de conteúdo proibido' })
        }
    })

    sock.ev.on('group-participants.update', async (update) => {
        if (update.action === 'add') {
            const user = update.participants[0]
            await sock.sendMessage(update.id, { text: `Seja bem-vindo ao grupo, @${user.split('@')[0]}!`, mentions: [user] })
        }
    })
}

startBot()
