import { Events, GuildMember, AttachmentBuilder, TextChannel } from 'discord.js';
import config from '../config/config.json' assert { type: 'json' };
import { CanvasHelper } from '../utils/canvasHelper.ts';

export default {
    name: Events.GuildMemberRemove,
    async execute(member: GuildMember) {
        const channelId = config.channels.leave;
        const channel = member.guild.channels.cache.get(channelId) as TextChannel;
        
        if (!channel) return;

        try {
            // Gerar Card de Saída
            const cardBuffer = await CanvasHelper.createMemberCard(member, 'leave');
            const attachment = new AttachmentBuilder(cardBuffer, { name: 'leave-card.png' });

            await channel.send({
                content: `😢 **${member.user.tag}** nos deixou.`,
                files: [attachment]
            });
        } catch (error) {
            console.error('[ERRO] Ao gerar card de saída:', error);
        }
    },
};
