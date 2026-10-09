import { createCanvas, loadImage, registerFont, Canvas } from 'canvas';
import { GuildMember, User } from 'discord.js';

/**
 * Utilitário para gerar cards visuais modernos usando Canvas.
 */
export class CanvasHelper {
    /**
     * Gera um card de boas-vindas ou saída.
     */
    static async createMemberCard(member: GuildMember | User, type: 'welcome' | 'leave'): Promise<Buffer> {
        const width = 800;
        const height = 350;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Fundo (Degradê Moderno)
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1e1e2e');
        gradient.addColorStop(1, '#11111b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Detalhes estéticos (Retângulos decorativos)
        ctx.fillStyle = 'rgba(88, 101, 242, 0.1)';
        ctx.fillRect(0, 0, 10, height);
        ctx.fillRect(width - 10, 0, 10, height);

        // Avatar Circular (com fallback seguro contra erros de rede)
        const avatarUrl = member instanceof User ? member.displayAvatarURL({ extension: 'png', size: 256 }) : member.user.displayAvatarURL({ extension: 'png', size: 256 });
        let avatar;
        try {
            avatar = await loadImage(avatarUrl);
        } catch {
            const fallbackUrl = (member instanceof User ? member : member.user).defaultAvatarURL;
            avatar = await loadImage(fallbackUrl);
        }
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(150, height / 2, 80, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 70, (height / 2) - 80, 160, 160);
        ctx.restore();

        // Borda do Avatar
        ctx.strokeStyle = '#5865f2';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(150, height / 2, 82, 0, Math.PI * 2, true);
        ctx.stroke();

        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px sans-serif';
        const titleText = type === 'welcome' ? 'BEM-VINDO(A)!' : 'SAIU DO SERVIDOR';
        ctx.fillText(titleText, 280, 150);

        ctx.fillStyle = '#b5bac1';
        ctx.font = '30px sans-serif';
        const username = member instanceof User ? member.username : member.user.username;
        ctx.fillText(username, 280, 200);

        ctx.fillStyle = '#5865f2';
        ctx.font = '20px sans-serif';
        const subText = type === 'welcome' ? 'Esperamos que se divirta conosco!' : 'Sentiremos sua falta...';
        ctx.fillText(subText, 280, 240);

        return canvas.toBuffer();
    }

    /**
     * Gera um card de status de registro (Aprovado/Reprovado).
     */
    static async createStatusCard(user: User, status: 'APROVADO' | 'REPROVADO', name: string): Promise<Buffer> {
        const width = 600;
        const height = 250;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Fundo
        ctx.fillStyle = '#1e1e2e';
        ctx.fillRect(0, 0, width, height);

        // Borda lateral por status
        ctx.fillStyle = status === 'APROVADO' ? '#57F287' : '#ED4245';
        ctx.fillRect(0, 0, 15, height);

        // Avatar (com fallback)
        let avatar;
        try {
            avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 128 }));
        } catch {
            avatar = await loadImage(user.defaultAvatarURL);
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(100, height / 2, 60, 0, Math.PI * 2, true);
        ctx.clip();
        ctx.drawImage(avatar, 40, (height / 2) - 60, 120, 120);
        ctx.restore();

        // Texto informativo
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(`REGISTRO ${status}`, 200, 100);

        ctx.fillStyle = '#b5bac1';
        ctx.font = '25px sans-serif';
        ctx.fillText(name, 200, 140);

        ctx.font = '18px sans-serif';
        ctx.fillText(`ID: ${user.id}`, 200, 175);

        return canvas.toBuffer();
    }

    /**
     * Gera um banner moderno para o sistema de registro.
     */
    static async createRegisterBanner(guildName: string, botAvatarUrl: string): Promise<Buffer> {
        const width = 1000;
        const height = 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Fundo com padrão moderno
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Grade decorativa
        ctx.strokeStyle = 'rgba(88, 101, 242, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        for (let j = 0; j < height; j += 40) {
            ctx.beginPath();
            ctx.moveTo(0, j);
            ctx.lineTo(width, j);
            ctx.stroke();
        }

        // Círculo Neon central
        ctx.shadowColor = '#5865f2';
        ctx.shadowBlur = 30;
        ctx.strokeStyle = '#5865f2';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(width / 2, 140, 90, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Bot Avatar (com fallback seguro)
        let avatar;
        try {
            avatar = await loadImage(botAvatarUrl);
        } catch {
            avatar = null;
        }
        if (avatar) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(width / 2, 140, 80, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatar, (width / 2) - 80, 60, 160, 160);
            ctx.restore();
        }

        // Texto
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px sans-serif';
        ctx.fillText(guildName.toUpperCase(), width / 2, 300);

        ctx.fillStyle = '#5865f2';
        ctx.font = 'bold 35px sans-serif';
        ctx.fillText('SISTEMA DE REGISTRO', width / 2, 350);

        return canvas.toBuffer();
    }
}
