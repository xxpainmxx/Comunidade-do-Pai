import { Events, Presence } from 'discord.js';
import db from '../database/db.ts';
import config from '../config/config.json' assert { type: 'json' };
import { LiveManager } from '../systems/liveSystem/liveManager.ts';

export default {
    name: Events.PresenceUpdate,
    async execute(oldPresence: Presence | null, newPresence: Presence) {
        if (!newPresence.guild || !newPresence.member) return;

        const isEnabled = await db.get('live_system_enabled') ?? config.liveSystem.enabled;
        if (!isEnabled) return;

        const liveRoleId = await db.get(`live_role_${newPresence.guild.id}`) || config.roles.live;
        if (!liveRoleId || liveRoleId === 'ID_DO_CARGO_LIVE_AQUI') return;

        const liveRole = newPresence.guild.roles.cache.get(liveRoleId);
        if (!liveRole) return;

        // Verificar se usuário está na lista autorizada
        const authorizedStreamers = await db.get(`streamers_${newPresence.guild.id}`) || [];
        if (!authorizedStreamers.includes(newPresence.member.id)) return;

        await LiveManager.updateMemberLiveStatus(newPresence.member, liveRole);
    }
};
