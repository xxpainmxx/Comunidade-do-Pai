import { Events, Client, REST, Routes } from 'discord.js';
import config from '../config/config.json' assert { type: 'json' };
import { RegistrationSystem } from '../systems/registrationSystem.ts';
import { LiveManager } from '../systems/liveSystem/liveManager.ts';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client) {
        console.log(`[BOT] Logado como ${client.user?.tag}`);

        // Inicializar Sistemas
        await LiveManager.startMonitoring(client);
        await RegistrationSystem.init(client).catch((err) => console.warn('[AVISO] Erro ao inicializar sistema de registro:', err));

        // Registrar comandos Slash
        const commands = (client as any).commands.map((cmd: any) => cmd.data.toJSON());
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

        try {
            console.log(`[SISTEMA] Iniciando registro de ${commands.length} comandos slash...`);

            // 1. Registro instantâneo por Servidor (Guild Commands aparecem na hora, sem delay de cache global)
            const guildId = process.env.GUILD_ID;
            if (guildId) {
                await rest.put(
                    Routes.applicationGuildCommands(client.user!.id, guildId),
                    { body: commands },
                );
                console.log(`[SISTEMA] ✅ Comandos slash registrados instantaneamente no servidor configurado (${guildId})!`);
            } else {
                for (const [id, guild] of client.guilds.cache) {
                    await rest.put(
                        Routes.applicationGuildCommands(client.user!.id, id),
                        { body: commands },
                    ).catch((err) => console.warn(`[AVISO] Falha ao registrar na guilda ${guild.name} (${id}):`, err?.message || err));
                    console.log(`[SISTEMA] ✅ Comandos slash registrados na guilda: ${guild.name} (${id})`);
                }
            }

            // 2. Registro Global (pode levar até 1 hora para propagar em todos os clientes Discord)
            await rest.put(
                Routes.applicationCommands(client.user!.id),
                { body: commands },
            );

            console.log('[SISTEMA] ✅ Comandos slash registrados também globalmente.');
        } catch (error) {
            console.error('[ERRO] Falha ao registrar comandos slash:', error);
        }
    },
};
