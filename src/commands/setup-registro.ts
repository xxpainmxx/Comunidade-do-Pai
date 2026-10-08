import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { RegistrationSystem } from '../systems/registrationSystem.ts';
import db from '../database/db.ts';

export default {
    data: new SlashCommandBuilder()
        .setName('setup-registro')
        .setDescription('Envia o painel de registro oficial no canal configurado.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction: CommandInteraction) {
        if (!interaction.deferred && !interaction.replied) {
            try {
                await interaction.deferReply({ ephemeral: true });
            } catch (err: any) {
                if (err.code === 10062) return;
                throw err;
            }
        }
        
        try {
            // Limpamos o ID anterior para forçar o RegistrationSystem a enviar uma nova mensagem
            await db.delete('register_main_message_id');
            
            await RegistrationSystem.init(interaction.client);
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: '✅ Painel de registro enviado com sucesso!' }).catch(() => null);
            }
        } catch (error: any) {
            if (error?.code === 10062) return;
            console.error('[ERRO] Ao executar setup-registro:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: '❌ Ocorreu um erro ao enviar o painel de registro.' }).catch(() => null);
            }
        }
    }
};
