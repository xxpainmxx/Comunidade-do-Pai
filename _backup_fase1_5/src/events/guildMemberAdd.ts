import { Events, GuildMember, AttachmentBuilder, TextChannel } from 'discord.js';
import config from '../config/config.json' assert { type: 'json' };
import { CanvasHelper } from '../utils/canvasHelper.ts';

export default {
    name: Events.GuildMemberAdd,
    async execute(member: GuildMember) {
        const channelId = config.channels.welcome;
        const channel = member.guild.channels.cache.get(channelId) as TextChannel;
        
        if (!channel) return;

        try {
            // Gerar Card de Boas-vindas
            const cardBuffer = await CanvasHelper.createMemberCard(member, 'welcome');
            const attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome-card.png' });

            await channel.send({
                content: `👋 Bem-vindo(a) ao servidor, ${member}!`,
                files: [attachment]
            });
        } catch (error) {
            console.error('[ERRO] Ao gerar card de boas-vindas:', error);
        }
    },
};
