import { Client, ActivityType, GuildMember, TextChannel, EmbedBuilder } from 'discord.js';
import db from '../../database/db.ts';
import config from '../../config/config.json' assert { type: 'json' };

export class LiveManager {
    private static isChecking = false;

    /**
     * Inicia o loop de verificação de Live
     */
    static async startMonitoring(client: Client) {
        setInterval(async () => {
            if (this.isChecking) return;
            this.isChecking = true;

            try {
                const isEnabled = await db.get('live_system_enabled') ?? config.liveSystem.enabled;
                if (!isEnabled) return;

                for (const guild of client.guilds.cache.values()) {
                    await this.checkGuildLives(guild).catch((err) => {
                        console.error(`[LIVE] Erro ao checar lives na guilda ${guild.name}:`, err);
                    });
                }
            } catch (e) {
                console.error('[LIVE] Erro no loop de monitoramento:', e);
            } finally {
                this.isChecking = false;
            }
        }, config.liveSystem.checkInterval);
    }

    /**
     * Verifica todos os membros de um servidor que estão em live
     */
    static async checkGuildLives(guild: any) {
        const liveRoleId = await db.get(`live_role_${guild.id}`) || config.roles.live;
        if (!liveRoleId || liveRoleId === 'ID_DO_CARGO_LIVE_AQUI') return;

        const liveRole = guild.roles.cache.get(liveRoleId);
        if (!liveRole) return;

        // Buscar lista oficial de streamers
        const authorizedStreamers = await db.get(`streamers_${guild.id}`) || [];
        if (authorizedStreamers.length === 0) return; // Se a lista estiver vazia, não monitora ninguém (ou opcionalmente monitora todos)

        for (const streamerId of authorizedStreamers) {
            const member = await guild.members.fetch(streamerId).catch(() => null);
            if (member) {
                await this.updateMemberLiveStatus(member, liveRole);
            }
        }
    }

    /**
     * Atualiza o status de um membro específico
     */
    static async updateMemberLiveStatus(member: GuildMember, liveRole: any) {
        const isStreaming = member.presence?.activities.some(activity => activity.type === ActivityType.Streaming);
        const hasRole = member.roles.cache.has(liveRole.id);

        if (isStreaming && !hasRole) {
            // Verificar se o bot pode gerenciar este membro e este cargo
            if (!member.guild.members.me?.permissions.has('ManageRoles')) {
                console.error('[LIVE] O bot não tem a permissão "Gerenciar Cargos"!');
                return;
            }

            if (liveRole.position >= (member.guild.members.me?.roles.highest.position || 0)) {
                console.error(`[LIVE] O cargo ${liveRole.name} está ACIMA do cargo do bot na hierarquia!`);
                return;
            }

            if (!member.manageable) {
                console.error(`[LIVE] O usuário ${member.user.tag} está ACIMA do bot na hierarquia e não pode ser editado.`);
                return;
            }

            try {
                await member.roles.add(liveRole);
                this.logLiveEvent(member, 'START');
            } catch (e: any) {
                if (e.code === 50013) {
                    console.error(`[LIVE] Falha de permissão ao adicionar cargo em ${member.user.tag}. Certifique-se de que o cargo do bot esteja ACIMA do cargo de Live na hierarquia do servidor.`);
                } else {
                    console.error(`[LIVE] Erro ao adicionar cargo em ${member.user.tag}:`, e);
                }
            }
        } else if (!isStreaming && hasRole) {
            if (!member.manageable) return;

            try {
                await member.roles.remove(liveRole);
                this.logLiveEvent(member, 'STOP');
            } catch (e: any) {
                console.error(`[LIVE] Erro ao remover cargo de ${member.user.tag}:`, e);
            }
        }
    }

    /**
     * Envia logs de live
     */
    static async logLiveEvent(member: GuildMember, type: 'START' | 'STOP') {
        const logChannelId = (config.channels as any).live_logs || config.channels.logs;
        const channel = member.guild.channels.cache.get(logChannelId) as TextChannel;
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(type === 'START' ? '#9146FF' : '#ff4b4b')
            .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
            .setDescription(type === 'START' 
                ? `🔴 **${member.user.username}** entrou em Live!` 
                : `⚪ **${member.user.username}** encerrou a Live.`)
            .setTimestamp();

        if (type === 'START') {
            const stream = member.presence?.activities.find(a => a.type === ActivityType.Streaming);
            if (stream && stream.url) {
                embed.addFields({ name: 'Link', value: `[Assistir agora](${stream.url})` });
            }
        }

        channel.send({ embeds: [embed] }).catch(() => null);
    }
}
