import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, Interaction } from 'discord.js';

export class ModalHelper {
    static createRegisterModal(userId: string) {
        const modal = new ModalBuilder()
            .setCustomId('registro_modal')
            .setTitle('Formulário de Registro');

        const nomeInput = new TextInputBuilder()
            .setCustomId('nome_completo')
            .setLabel('Nome Completo')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Digite seu nome aqui...')
            .setRequired(true);

        const idInput = new TextInputBuilder()
            .setCustomId('id_discord')
            .setLabel('Confirme seu ID do Discord')
            .setStyle(TextInputStyle.Short)
            .setValue(userId)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(nomeInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(idInput)
        );

        return modal;
    }
}
