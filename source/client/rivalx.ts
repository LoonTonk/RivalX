/*
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * RivalX implementation : © LoonTonk
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */
/// <amd-module name="bgagame/rivalx"/>

import Gamegui = require('ebg/core/gamegui');
import "ebg/counter";

/** The root for all of your game code. */
class RivalX extends Gamegui
{
	numWilds = 0;
	// myGlobalArray: string[] = [];

	/** @gameSpecific See {@link Gamegui} for more information. */
	constructor(){
		super();
		console.log('rivalx constructor');
	}

	/** @gameSpecific See {@link Gamegui.setup} for more information. */
	override setup(gamedatas: Gamedatas): void
	{
		console.log( "Starting game setup" );
		// Place the tokens on the board
		for( let i in gamedatas.board )
			{
				let square = gamedatas.board[i];
		
				if( square !== undefined && square.player != -1 ) { // If square is defined and has a player
					this.addTokenOnBoard( square.x, square.y, square.player, square.player == 0 ); //Adds wild token if player id is 0
				}
				if (square !== undefined && square.player_tile != -1) {
					console.log("square is " + square + " square.player_tile is " + square.player_tile);
					this.addTileOnBoard(square.x, square.y, square.player_tile);
				}
			}
	
		dojo.query( '.square' ).connect( 'onclick', this, 'onplaceToken' );
		// Setup game notifications to handle (see "setupNotifications" method below)
		this.setupNotifications(); // <-- Keep this line
		
		// TODO: Set up your game interface here, according to "gamedatas"

		console.log( "Ending game setup" );
	}

	///////////////////////////////////////////////////
	//// Game & client states
	
	/** @gameSpecific See {@link Gamegui.onEnteringState} for more information. */
	override onEnteringState(stateName: GameStateName, args: CurrentStateArgs): void
	{
		console.log( 'Entering state: '+stateName );
		
/* 		switch( stateName )
		{
		case 'dummmy':
			break;
		} */
	}

	/** @gameSpecific See {@link Gamegui.onLeavingState} for more information. */
	override onLeavingState(stateName: GameStateName): void
	{
		console.log( 'Leaving state: '+stateName );
		
/* 		switch( stateName )
		{
		case 'dummmy':
			break;
		} */
	}

	/** @gameSpecific See {@link Gamegui.onUpdateActionButtons} for more information. */
	override onUpdateActionButtons(stateName: GameStateName, args: AnyGameStateArgs | null): void
	{
		console.log( 'onUpdateActionButtons: ' + stateName, args );                   
		if (this.isCurrentPlayerActive()) {            
			switch( stateName ) {
			case 'wildPlacement':
				if (args?.numWilds !== undefined && args.numWilds >= 5) {
					console.log("should add button now");
					this.addActionButton( 'finishTurn_button', _('Finish Turn'), 'onfinishTurn' ); 
				}
				break;
			}
		}
	}

	///////////////////////////////////////////////////
	//// Utility methods
	
	/** Adds a token matching the given player to the board at the specified location. */
	addTokenOnBoard( x: number, y: number, player_id: number, wild: boolean )
	{
		if (wild) {
			dojo.place( this.format_block( 'jstpl_token', { // Player is placing a wild token, color should be 0 instead of player color
				color: 0,
				x_y: `${x}_${y}`
			} ) , 'board' );
		} else {
			let player = this.gamedatas.players[ player_id ];
			if (!player) {
				throw new Error( 'Unknown player id: ' + player_id );
			}
			dojo.place( this.format_block( 'jstpl_token', {
				color: player.color,
				x_y: `${x}_${y}`
			} ) , 'board' );
		}
		if (player_id != 0) {
			this.placeOnObject( `token_${x}_${y}`, `overall_player_board_${player_id}` );
			this.slideToObject( `token_${x}_${y}`, `square_${x}_${y}` ).play();
		} else {
			this.placeOnObject( `token_${x}_${y}`, `square_${x}_${y}` );
		}
	}

	/** Adds a tile matching the given player to the board at the specified location. */
	addTileOnBoard( x: number, y: number, player_id: number)
	{
		let player = this.gamedatas.players[ player_id ];
		if (!player) {
			throw new Error( 'Unknown player id: ' + player_id );
		}
		const square = $<HTMLElement>( `square_${x}_${y}` );
		square?.classList.add(`squarecolor_${player.color}`)
	}
	

	///////////////////////////////////////////////////
	//// Player's action
	
	onplaceToken( evt: Event )
	{
		// Stop this event propagation
		evt.preventDefault();

		if (!(evt.currentTarget instanceof HTMLElement))
			throw new Error('evt.currentTarget is null! Make sure that this function is being connected to a DOM HTMLElement.');

		// TODO: Check if this is a possible move

		// Check that this action is possible at this moment (shows error dialog if not possible)
		if( this.checkAction( 'placeToken', true ) ) {
			// Get the clicked square x and y
			// Note: square id format is "square_X_Y"
			let [_square_, x, y] = evt.currentTarget.id.split('_');
			const token = $<HTMLElement>( `token_${x}_${y}` );
			if (token !== null) { // Check if there is already a token at this square's location
				this.showMessage("Cannot play here, there is already a token", "error");
				return;
			}
	
			this.ajaxcall( `/${this.game_name}/${this.game_name}/placeToken.html`, {
				x, y, lock: true
			}, this, function() {} );
		} else if (this.checkAction('placeWild')) {
			// Get the clicked square x and y
			// Note: square id format is "square_X_Y"
			let [_square_, x, y] = evt.currentTarget.id.split('_');
			const token = $<HTMLElement>( `token_${x}_${y}` );
			if (token !== null) { // Check if there is already a token at this square's location
				this.showMessage("Cannot play here, there is already a token", "error");
				return;
			}
	
			this.ajaxcall( `/${this.game_name}/${this.game_name}/placeWild.html`, {
				x, y, lock: true
			}, this, function() {} );
		}
	}

	onfinishTurn( evt: Event )
	{
		// Stop this event propagation
		evt.preventDefault();

		if (!(evt.currentTarget instanceof HTMLElement))
			throw new Error('evt.currentTarget is null! Make sure that this function is being connected to a DOM HTMLElement.');
		// Check that this action is possible at this moment (shows error dialog if not possible)
		if( this.checkAction('finishTurn') ) {
			this.ajaxcall( `/${this.game_name}/${this.game_name}/finishTurn.html`, {lock: true}, this, function() {} );
		}
	}
	/*
		Here, you are defining methods to handle player's action (ex: results of mouse click on game objects).
		
		Most of the time, these methods:
		- check the action is possible at this game state.
		- make a call to the game server
	*/
	
	/*
	Example:
	onMyMethodToCall1( evt: Event )
	{
		console.log( 'onMyMethodToCall1' );

		// Preventing default browser reaction
		evt.preventDefault();

		//	With base Gamegui class...

		// Check that this action is possible (see "possibleactions" in states.inc.php)
		if(!this.checkAction( 'myAction' ))
			return;

		this.ajaxcall( "/yourgamename/yourgamename/myAction.html", { 
			lock: true, 
			myArgument1: arg1,
			myArgument2: arg2,
		}, this, function( result ) {
			// What to do after the server call if it succeeded
			// (most of the time: nothing)
		}, function( is_error) {

			// What to do after the server call in anyway (success or failure)
			// (most of the time: nothing)
		} );


		//	With GameguiCookbook::Common...
		this.ajaxAction( 'myAction', { myArgument1: arg1, myArgument2: arg2 }, (is_error) => {} );
	}
	*/

	///////////////////////////////////////////////////
	//// Reaction to cometD notifications

	/** @gameSpecific See {@link Gamegui.setupNotifications} for more information. */
	override setupNotifications()
	{
		console.log( 'notifications subscriptions setup' );

		dojo.subscribe( 'playToken', this, "notif_playToken" );
		this.notifqueue.setSynchronous( 'playToken', 500 );
		// TODO: here, associate your game notifications with local methods
		
		// With base Gamegui class...
		// dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );

		// With GameguiCookbook::Common class...
		// this.subscribeNotif( 'cardPlayed', this.notif_cardPlayed ); // Adds type safety to the subscription
	}

	notif_playToken( notif: NotifAs<'playToken'> )
	{
		this.addTokenOnBoard( notif.args.x, notif.args.y, notif.args.player_id, notif.args.wild );
	}

	/*
	Example:
	
	// The argument here should be one of there things:
	// - `Notif`: A notification with all possible arguments defined by the NotifTypes interface. See {@link Notif}.
	// - `NotifFrom<'cardPlayed'>`: A notification matching any other notification with the same arguments as 'cardPlayed' (A type can be used here instead). See {@link NotifFrom}.
	// - `NotifAs<'cardPlayed'>`: A notification that is explicitly a 'cardPlayed' Notif. See {@link NotifAs}.
	notif_cardPlayed( notif: NotifFrom<'cardPlayed'> )
	{
		console.log( 'notif_cardPlayed', notif );
		// Note: notif.args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call
	}
	*/
}


// The global 'bgagame.rivalx' class is instantiated when the page is loaded. The following code sets this variable to your game class.
dojo.setObject( "bgagame.rivalx", RivalX );
// Same as: (window.bgagame ??= {}).rivalx = RivalX;