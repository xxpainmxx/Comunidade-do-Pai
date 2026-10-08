import { Client, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import config from '../config/config.json' assert { type: 'json' };
import db from '../database/db.ts';
import { CanvasHelper } from '../utils/canvasHelper.ts';

/**
 * Sistema para gerenciar a mensagem automática de registro.
 */
export class RegistrationSystem {
    static async init(client: Client) {
        const channelId = config.channels.register_landing;
        const channel = client.channels.cache.get(channelId) as TextChannel;

        if (!channel) {
            return console.warn(`[AVISO] Canal de landing de registro não encontrado (ID: ${channelId})`);
        }

        // Recuperar ID da última mensagem enviada
        const lastMessageId = await db.get('register_main_message_id');

        // Verificar se a mensagem ainda existe no canal
        if (lastMessageId) {
            try {
                const existingMsg = await channel.messages.fetch(lastMessageId).catch(() => null);
                if (existingMsg) {
                    console.log(`[SISTEMA] Mensagem de registro já existe no canal #${channel.name} (fixa).`);
                    return; // Mensagem já existe, não faz nada
                }
            } catch (e) {
                console.error('[ERRO] Ao verificar mensagem de registro:', e);
            }
        }

        // Gerar Banner Canvas (com avatar otimizado em memória)
        const bannerBuffer = await CanvasHelper.createRegisterBanner(
            channel.guild.name, 
            client.user!.displayAvatarURL({ extension: 'png', size: 256 })
        );
        const attachment = new AttachmentBuilder(bannerBuffer, { name: 'register-banner.png' });

        // Criar Embed
        const embed = new EmbedBuilder()
            .setTitle('📋 REGISTRO OFICIAL')
            .setDescription(`🔥 Antes de começar sua jornada no servidor...

Faça seu registro oficial!

**Assim você poderá:**
✅ Receber cargos exclusivos
✅ Liberar canais secretos
✅ Participar de eventos
✅ Fazer parte da comunidade oficialmente

Preencha tudo corretamente no modal que irá se abrir e aguarde a aprovação rápida da nossa staff. 🚨`)
            .setColor(config.colors.main as any)
            .setImage('attachment://register-banner.png')
            .setFooter({ text: channel.guild.name, iconURL: channel.guild.iconURL() || undefined });

        // Criar Botão
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('open_register_modal')
                .setLabel('Fazer Registro')
                .setEmoji('📋')
                .setStyle(ButtonStyle.Primary)
        );

        // Enviar nova mensagem
        const newMsg = await channel.send({
            embeds: [embed],
            components: [row],
            files: [attachment]
        });

        // Salvar novo ID
        await db.set('register_main_message_id', newMsg.id);
        
        console.log(`[SISTEMA] Mensagem de registro atualizada no canal #${channel.name}`);
    }
}
