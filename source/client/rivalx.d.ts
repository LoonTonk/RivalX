/*
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * RivalX implementation : © LoonTonk
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

// If you have any imports/exports in this file, 'declare global' is access/merge your game specific types with framework types. 'export {};' is used to avoid possible confusion with imports/exports.
declare global {

	/** @gameSpecific Add game specific notifications / arguments here. See {@link NotifTypes} for more information. */
	interface NotifTypes {
		'playToken': { x: number, y: number, player_id: number }; // NOTE: most of these are calling for numbers, but SQL queries return strings so these are actually strings, not numbers
		'markSelectableTokens': { x: number, y: number }[];
		'newScores': { scores: Record<number, number> };
		'removeTokens': {playerTokens: { x: number, y: number}[], player_id: string};
		'addScoreTiles': { x: number, y: number, player_id: number}[];
		'outlinePatterns': {x: number, y: number, patterns: string[]};
		'moveWild': { old_x: number, old_y: number, new_x: number, new_y: number };
		// [name: string]: any; // Uncomment to remove type safety on notification names and arguments
	}

	/** @gameSpecific Add game specific gamedatas arguments here. See {@link Gamedatas} for more information. */
	interface Gamedatas {
		board: {x: number, y: number, player: number, player_tile: number, selectable: number, lastPlayed: number}[];
		tokensLeft: {[key: number]: string};
		// [key: string | number]: Record<keyof any, any>; // Uncomment to remove type safety on game state arguments
	}

	//
	// When gamestates.jsonc is enabled in the config, the following types are automatically generated. And you should not add to anything to 'GameStates' or 'PlayerActions'. If gamestates.jsonc is enabled, 'GameStates' and 'PlayerActions' can be removed from this file.
	//

	interface GameStates {
		// [id: number]: string | { name: string, argsType: object} | any; // Uncomment to remove type safety with ids, names, and arguments for game states
	}

	/** @gameSpecific Add game specific player actions / arguments here. See {@link PlayerActions} for more information. */
	interface PlayerActions {
		// [action: string]: Record<keyof any, any>; // Uncomment to remove type safety on player action names and arguments
	}
}

export {}; // Force this file to be a module.