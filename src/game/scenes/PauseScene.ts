import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create() {
        const { width, height } = this.scale;

        // overlay semi-transparent
        this.add.rectangle(0, 0, width, height, 0x000000, 0.65).setOrigin(0).setDepth(0);

        this.add.text(width / 2, height * 0.28, 'PAUSA', {
            fontFamily: 'Courier New, monospace',
            fontSize: '28px',
            color: '#00ff6a'
        }).setOrigin(0.5).setDepth(1);

        const resume = this.add.text(width / 2, height * 0.45, 'Retomar (R)', {
            fontFamily: 'Courier New, monospace',
            fontSize: '18px',
            color: '#88ff99'
        }).setOrigin(0.5).setDepth(1).setInteractive({ useHandCursor: true });

        const restart = this.add.text(width / 2, height * 0.55, 'Reiniciar (N)', {
            fontFamily: 'Courier New, monospace',
            fontSize: '18px',
            color: '#88ff99'
        }).setOrigin(0.5).setDepth(1).setInteractive({ useHandCursor: true });

        const quit = this.add.text(width / 2, height * 0.65, 'Voltar ao Menu (Q)', {
            fontFamily: 'Courier New, monospace',
            fontSize: '18px',
            color: '#ff6a6a'
        }).setOrigin(0.5).setDepth(1).setInteractive({ useHandCursor: true });

        resume.on('pointerdown', () => this.resumeGame());
        restart.on('pointerdown', () => this.restartGame());
        quit.on('pointerdown', () => this.quitToMenu());

        // keyboard shortcuts
        this.input.keyboard?.on('keydown-R', () => this.resumeGame());
        this.input.keyboard?.on('keydown-N', () => this.restartGame());
        this.input.keyboard?.on('keydown-Q', () => this.quitToMenu());
        this.input.keyboard?.on('keydown-ESC', () => this.resumeGame());
    }

    resumeGame() {
        // resume the Game scene and stop PauseScene
        if (this.scene.isPaused('Game')) {
            this.scene.resume('Game');
        }
        this.scene.stop();
    }

    restartGame() {
        // Optimized restart: if the running Game scene exposes a restart() method, call it
        const gameScene = this.scene.get('Game') as any;
        if (gameScene && typeof gameScene.restart === 'function') {
            // if paused, resume before calling restart to ensure proper internal state
            if (this.scene.isPaused('Game')) this.scene.resume('Game');
            try {
                gameScene.restart();
            } catch (e) {
                // fallback to full stop/start if restart throws
                if (this.scene.isActive('Game') || this.scene.isPaused('Game')) this.scene.stop('Game');
                this.scene.start('Game');
            }
        } else {
            // fallback: stop and start to create a fresh scene instance
            if (this.scene.isActive('Game') || this.scene.isPaused('Game')) this.scene.stop('Game');
            this.scene.start('Game');
        }

        // finally close the pause overlay
        this.scene.stop();
    }

    quitToMenu() {
        // stop Game and go back to StartScene
        this.scene.stop('Game');
        this.scene.start('StartScene');
        this.scene.stop();
    }
}
