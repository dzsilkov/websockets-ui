import {CommandsType} from '../../models/models';
import {singlePlayHandler} from './single-play-handler';
import {attackHandler} from './attack-handler';
import {registrationHandler} from './registration-handler';
import {createRoomHandler} from './create-room-handler';
import {addUserToRoomHandler} from './add-user-to-room-handler';
import {addShipsHandler} from './add-ships-handler';
import {randomAttackHandler} from './random-attack-handler';

export const handlerRequests = (type) => {
    return {
        [CommandsType.Reg]: (ws, data, wss) => registrationHandler(ws, data, wss),
        [CommandsType.CreateRoom]: (ws, data, wss) => createRoomHandler(ws, data, wss),
        [CommandsType.AddUserToRoom]: (ws, data, wss) => addUserToRoomHandler(ws, data, wss),
        [CommandsType.AddShips]: (ws, data, wss) => addShipsHandler(ws, data, wss),
        [CommandsType.Attack]: (ws, data, wss) => attackHandler(ws, data, wss),
        [CommandsType.RandomAttack]: (ws, data, wss) => randomAttackHandler(ws, data, wss),
        [CommandsType.SinglePlay]: (ws, data, wss) => singlePlayHandler(ws, data, wss)
    }[type];
};