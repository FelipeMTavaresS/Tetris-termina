import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Scale,Types } from 'phaser';

// Para mais informações sobre GameConfig veja:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
// O tamanho do canvas corresponde à grade do Tetris (10x20 células)
// mais a pequena margem (+8) usada em render()
const GRID_W = 10;
const GRID_H = 20;
const CELL_SIZE = 32;
const CANVAS_W = GRID_W * CELL_SIZE + 8; // +8 matches render padding
const CANVAS_H = GRID_H * CELL_SIZE + 8;
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: CANVAS_W,
    height: CANVAS_H,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Scale.NONE,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        MainGame
    ]
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
}

export default StartGame;
