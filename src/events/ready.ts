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

        // Registrar comandos Slash
        const commands = (client as any).commands.map((cmd: any) => cmd.data.toJSON());
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

        try {
            console.log(`[SISTEMA] Iniciando atualização de ${commands.length} comandos slash...`);
            
            await rest.put(
                Routes.applicationCommands(client.user!.id),
                { body: commands },
            );

            console.log('[SISTEMA] Comandos slash registrados com sucesso globalmente.');
        } catch (error) {
            console.error('[ERRO] Falha ao registrar comandos slash:', error);
        }
    },
};
