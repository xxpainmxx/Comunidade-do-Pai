import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import db from '../database/db.ts';
import config from '../config/config.json' assert { type: 'json' };

export default {
    data: new SlashCommandBuilder()
        .setName('live-config')
        .setDescription('Configurações do sistema de Live ON')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction: CommandInteraction) {
        const isEnabled = await db.get('live_system_enabled') ?? config.liveSystem.enabled;
        const liveRole = await db.get(`live_role_${interaction.guildId}`) || config.roles.live;

        const embed = new EmbedBuilder()
            .setTitle('🔴 Configuração de Live ON')
            .setDescription(`Gerencie como o bot detecta e atribui cargos para streamers.

**Status Atual:** ${isEnabled ? '✅ Ativado' : '❌ Desativado'}
**Cargo de Live:** ${liveRole !== 'ID_DO_CARGO_LIVE_AQUI' ? `<@&${liveRole}>` : 'Não configurado'}`)
            .setColor(config.colors.main as any)
            .setThumbnail(interaction.guild?.iconURL() || null);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('manage_streamers')
                .setLabel('Gerenciar Streamers')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('👥')
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
