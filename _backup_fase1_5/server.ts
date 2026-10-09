import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits, Collection, Partials, Options } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- SERVIDOR WEB (KEEP ALIVE & STATUS) ---
const app = express();
const PORT = 3000;

app.disable('x-powered-by');

app.get('/', (req, res) => {
    res.send('Bot de Registro está ONLINE! 🚀');
});

// Endpoint de diagnóstico de memória RAM para monitoramento na ACLClouds/Pterodactyl
app.get('/status', (req, res) => {
    const memory = process.memoryUsage();
    const rssMB = Math.round(memory.rss / 1024 / 1024);
    const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memory.heapTotal / 1024 / 1024);

    res.json({
        status: 'online',
        ram: {
            rssMB: `${rssMB} MB`,
            heapUsedMB: `${heapUsedMB} MB`,
            heapTotalMB: `${heapTotalMB} MB`,
            maxTarget: '300 MB',
            health: rssMB < 250 ? 'OK' : 'ALTO'
        },
        uptimeSeconds: Math.round(process.uptime()),
        guilds: client.guilds?.cache.size ?? 0,
        ping: client.ws?.ping ?? 0
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[STATUS] Servidor Keep-Alive rodando na porta ${PORT}`);
});

// --- CLIENTE DISCORD OTIMIZADO PARA BAIXA MEMÓRIA (MÁX 300MB) ---
export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.User, Partials.GuildMember, Partials.Message],
    // ⚡ OTIMIZAÇÃO CRÍTICA DE CACHE: Evita reter centenas de megabytes em memória
    makeCache: Options.cacheWithLimits({
        ApplicationCommandManager: 0,
        BaseGuildEmojiManager: 0,
        GuildBanManager: 0,
        GuildInviteManager: 0,
        GuildStickerManager: 0,
        GuildScheduledEventManager: 0,
        MessageManager: 10, // Máximo 10 mensagens por canal (evita acúmulo de centenas de MBs)
        ReactionManager: 0,
        ReactionUserManager: 0,
        StageInstanceManager: 0,
        ThreadManager: 0,
        ThreadMemberManager: 0,
        VoiceStateManager: 0,
        PresenceManager: 50
    }),
    // 🧹 Limpador automático de mensagens e membros inativos a cada poucos minutos
    sweepers: {
        ...Options.DefaultSweeperSettings,
        messages: {
            interval: 180, // A cada 3 minutos
            lifetime: 60   // Limpa mensagens com mais de 60s
        },
        users: {
            interval: 300, // A cada 5 minutos
            filter: () => (user) => user.id !== client.user?.id && !user.bot
        }
    }
});

// Tratamento de segurança contra crashes não tratados
process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason);
});

process.on('uncaughtException', (error) => {
    console.error('[UNCAUGHT EXCEPTION]', error);
});

// Extensão do cliente para comandos
(client as any).commands = new Collection();

// --- HANDLERS ---
const loadHandlers = async () => {
    // Carregar Eventos
    const eventsPath = join(__dirname, 'src', 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    for (const file of eventFiles) {
        const { default: event } = await import(`./src/events/${file}`);
        const execute = async (...args: any[]) => {
            try {
                await event.execute(...args);
            } catch (error: any) {
                console.error(`[ERRO CRÍTICO] Falha ao executar evento ${event.name}:`, error);
            }
        };

        if (event.once) {
            client.once(event.name, execute);
        } else {
            client.on(event.name, execute);
        }
    }

    // Carregar Comandos
    const commandsPath = join(__dirname, 'src', 'commands');
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    for (const file of commandFiles) {
        const { default: command } = await import(`./src/commands/${file}`);
        (client as any).commands.set(command.data.name, command);
    }

    console.log(`[SISTEMA] ${eventFiles.length} eventos e ${(client as any).commands.size} comandos carregados.`);
};

// Iniciar Bot
const start = async () => {
    await loadHandlers();
    
    if (!process.env.DISCORD_TOKEN) {
        console.error('[ERRO] DISCORD_TOKEN não encontrado no .env');
        return;
    }

    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error: any) {
        if (error.message.includes('disallowed intents')) {
            console.error('\n[❌ ERRO CRÍTICO] O Bot não tem permissão para acessar Membros ou Conteúdo de Mensagens!');
            console.error('👉 Verifique se você ativou "SERVER MEMBERS INTENT" e "MESSAGE CONTENT INTENT" no Discord Developer Portal (aba Bot).\n');
        } else {
            console.error('[ERRO] Falha ao logar no Discord:', error);
        }
    }
};

start();
