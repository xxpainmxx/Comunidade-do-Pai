import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { ModalHelper } from '../utils/modalHelper.ts';

export default {
    data: new SlashCommandBuilder()
        .setName('registro')
        .setDescription('Inicie seu processo de registro no servidor GamerZone.'),
    async execute(interaction: CommandInteraction) {
        const modal = ModalHelper.createRegisterModal(interaction.user.id);
        await interaction.showModal(modal);
    },
};
