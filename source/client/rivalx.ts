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

declare class Counter {
	speed: number; // duration of the animation, default is 100ms
  
	create(target: string): void; //  associate counter with existing target DOM element
	getValue(): number; //  return current value
	incValue(by: number): number; //  increment value by "by" and animate from previous value
	setValue(value: number): void; //  set value, no animation
	toValue(value: number): void; // set value with animation
	disable(): void; // Sets value to "-"
  }

/** The root for all of your game code. */
class RivalX extends Gamegui
{
	static readonly MAX_WILDS: number = 5;
	private wildsPossibleMoves: boolean[][][] = [];
	private remainingTokensCounter: {[player_id: number]: Counter} = [];
	/** @gameSpecific See {@link Gamegui} for more information. */
	constructor(){
		super();
		console.log('rivalx constructor');
	}

	/** @gameSpecific See {@link Gamegui.setup} for more information. */
	override setup(gamedatas: Gamedatas): void
	{
		console.log( "Starting game setup" );
		
		// Setting up player boards, specifically counter for tokens left and teams (if applicable)
		for( var player_id in gamedatas.players ) {
 				var player = gamedatas.players[player_id];
				if (player === undefined) {
					throw new Error("Player is undefined on setup");
				}
				// Setting up players boards if needed
				var player_board_div = $('player_board_'+player_id);
				if (player_board_div === null) {
					throw new Error("when trying to get player board it was null");
				}
				dojo.place( this.format_block('jstpl_player_board', {id:player.id, color:player.color} ), player_board_div );
				const counter = new ebg.counter();
				counter.create('remainingTokens_'+player_id);
				const tokensLeft = gamedatas.tokensLeft[parseInt(player_id)];
				if (tokensLeft === undefined) {
					console.log("tokensLeft is undefined, player id is: ");
					console.log(player_id);
					throw new Error();
				}
				counter.setValue(parseInt(tokensLeft));
				this.remainingTokensCounter[player_id] = counter;

				if (gamedatas.isTeams) {
					dojo.place( this.format_block('jstpl_team_icon', {teamNum: gamedatas.playerTeams[parseInt(player_id)]} ), player_board_div );
				}
		}

		// Place the tokens on the board
		for( let i in gamedatas.board )
			{
				let square = gamedatas.board[i];
		
				if( square !== undefined && square.player != -1 ) { // If square is defined and has a player
					this.addTokenOnBoard( square.x, square.y, square.player, square.selectable == 1); //Adds wild token if player id is 1-5
				}
				if (square !== undefined && square.player_tile != -1) {
					this.addTileOnBoard(square.x, square.y, square.player_tile);
				}
				if (square !== undefined && square.lastPlayed > 1) {
					this.addLastPlayedToBoard(square.x, square.y, square.lastPlayed);
				}
			}
		dojo.query( '.square' ).connect( 'onclick', this, 'onsquareClick' );
		
		// Setup game notifications to handle (see "setupNotifications" method below)
		this.setupNotifications(); // <-- Keep this line

		console.log( "Ending game setup" );
	}

	///////////////////////////////////////////////////
	//// Game & client states
	
	/** @gameSpecific See {@link Gamegui.onEnteringState} for more information. */
	override onEnteringState(stateName: GameStateName, args: CurrentStateArgs): void
	{
		console.log( 'Entering state: '+stateName );
		
		switch( stateName )
		{
		case 'wildPlacement':
			this.updatePossibleMoves( args.args!.possibleMoves, 'wildPlacement' );
			break;
		case 'playerTurn':
			this.clearSelectable();
			this.clearPatterns();
			this.updatePossibleMoves( args.args!.possibleMoves, 'playerTurn' );
			break;
		case 'repositionWilds':
			this.wildsPossibleMoves = args.args!.possibleMoves;
			this.updatePossibleMoves([], 'repositionWild');
			break;
		} 
	}

	/** @gameSpecific See {@link Gamegui.onLeavingState} for more information. */
	override onLeavingState(stateName: GameStateName): void
	{
		switch(stateName) {
			case 'wildPlacement':
				this.clearLastPlayed();
				break;
		}
	}

	/** @gameSpecific See {@link Gamegui.onUpdateActionButtons} for more information. */
	override onUpdateActionButtons(stateName: GameStateName, args: AnyGameStateArgs | null): void
	{
		console.log( 'onUpdateActionButtons: ' + stateName, args );                   
		if (this.isCurrentPlayerActive()) {            
			switch( stateName ) {
				case 'repositionWilds':
					this.addActionButton( 'finishTurn_button', _('Finish Turn'), 'onfinishTurn' ); 
			}
		}
	}

	///////////////////////////////////////////////////
	//// Utility methods
	
	clearPatterns() {
		document.querySelectorAll('.pattern').forEach(element => {
			dojo.destroy(element);
		});
	}

	clearSelectedToken() {
		// Remove selected tag from any previous tokens
		document.querySelectorAll('.selected').forEach(element => {
			element.classList.remove('selected');
		});
	}

	/** Removes the 'selectable' and 'selected' class from all elements. */
	clearSelectable() {
		document.querySelectorAll('.selectable').forEach(element => {
			const [_token_, x, y] = element.closest('.token')!.id.split('_');
			if (x === undefined || y === undefined) {
				throw new Error("When trying to get x and y from id of selectable token it was undefined");
			}
			this.removeSelectable(parseInt(x),parseInt(y));
		});
	}
	/** Removes the 'selectable' class from one element and changes the tooltip */
	removeSelectable(x: number, y: number) {
		dojo.empty(`token_${x}_${y}`);
		this.addTooltip(`token_${x}_${y}`, _('This is a Wild X-piece'), '');
	}

	/** Removes the 'possibleMove' class from all elements. */
	clearPossibleMoves() {
		document.querySelectorAll('.possibleMove').forEach(element => {
			this.removeTooltip(element.id);
			element.classList.remove('possibleMove');
		});
	}

	clearLastPlayed() {
		document.querySelectorAll('.lastPlayed').forEach(element => {
			dojo.destroy(element);
		});
	}

	addLastPlayedToBoard(x: number, y: number, lastPlayed: number) {
		const color = this.gamedatas.players[lastPlayed]!.color;
		document.querySelectorAll(`.lastPlayedcolor_${color}`).forEach(element => {
			dojo.destroy(element);
		});
		dojo.place( this.format_block( 'jstpl_lastPlayed', {
			color: color,
			x_y: `${x}_${y}`,
			player_id: lastPlayed
		} ) , 'board' );
		this.placeOnObject( `lastPlayed_${x}_${y}_${lastPlayed}`, `square_${x}_${y}` );
		const lastPlayedToolTip = dojo.string.substitute( _("${player}'s last move was here"), {
			player: this.gamedatas.players[lastPlayed]!.name
		} );
		this.addTooltip(`lastPlayed_${x}_${y}_${lastPlayed}`, lastPlayedToolTip, '');
	}

	addTokenOutline(x: number, y: number) {
		dojo.place( this.format_block( 'jstpl_token_outline', {
			x_y: `${x}_${y}`,
		} ) , 'board' );
		this.placeOnObject( `token_outline_${x}_${y}`, `square_${x}_${y}` );
	}

	clearTokenOutline() {
		document.querySelectorAll('.token_outline').forEach(element => {
			dojo.destroy(element);
		});
	}

	markSelectableToken(x: number, y: number) {
		var selectable_token = $(`token_${x}_${y}`);
		if (selectable_token === null) {
			throw new Error("when trying to get selectable token it was null");
		}
		dojo.place("<div class='selectable'></div>", selectable_token );
		// Change tooltip
		this.addTooltip(`token_${x}_${y}`, '', _('Select this wild to reposition it'));
	}

	/** Updates the squares on the board matching the possible moves. */
	updatePossibleMoves( possibleMoves: boolean[][], gameState: string )
	{
		this.clearPossibleMoves();
		for( var x in possibleMoves )
		{
			for( var y in possibleMoves[ x ] )
			{
				let square = $(`square_${x}_${y}`);
				if( !square )
					throw new Error( `Unknown square element: ${x}_${y}. Make sure the board grid was set up correctly in the tpl file.` );
				square.classList.add('possibleMove');
			}
		}
		switch(gameState) {
			case ('wildPlacement'):
				this.addTooltipToClass( 'possibleMove', '', _('Place a Wild here') );
				break;
			case ('playerTurn'):
				this.addTooltipToClass( 'possibleMove', '', _('Place your X-piece here') );
				break;
			case ('moveWild'):
				this.addTooltipToClass( 'possibleMove', '', _('Move the selected Wild here') );
				break;
			case ('repositionWild'):
				break;
			default:
				throw new Error("when trying to update possible moves it was not in one of the specified states for adding tooltips")
		}
	}

	/** Adds a token matching the given player to the board at the specified location. */
	addTokenOnBoard( x: number, y: number, player_id: number, selectable: boolean )
	{
		if (this.isWild(player_id)) {
			dojo.place( this.format_block( 'jstpl_token', { // Player is placing a wild token, color should be 0 instead of player color
				color: 0,
				x_y: `${x}_${y}`
			} ) , 'board' );
			$(`token_${x}_${y}`)?.classList.add(`wild_${player_id}`);
			player_id = this.getCurrentPlayerId();
			this.addTooltip( `token_${x}_${y}`, _('This is a Wild X-piece'), '');
		} else { // it's a player token
			let player = this.gamedatas.players[ player_id ];
			if (!player) {
				throw new Error( 'Unknown player id: ' + player_id );
			}
			dojo.place( this.format_block( 'jstpl_token', {
				color: player.color,
				x_y: `${x}_${y}`
			} ) , 'board' );
			const playerTokenTooltip = dojo.string.substitute( _("This is ${player}'s X-piece"), {
				player: this.gamedatas.players[player_id]!.name
			} );
			this.addTooltip( `token_${x}_${y}`, playerTokenTooltip, '');
		}
		dojo.connect( $(`token_${x}_${y}`), 'onclick', this, 'onselectToken' );
		if (selectable) {
			this.markSelectableToken(x,y);
		}
		this.placeOnObject( `token_${x}_${y}`, `overall_player_board_${player_id}` );
		this.slideToObject( `token_${x}_${y}`, `square_${x}_${y}` ).play();
	}

	/** Adds a tile matching the given player to the board at the specified location. */
	addTileOnBoard( x: number, y: number, player_id: number)
	{
		let player = this.gamedatas.players[ player_id ];
		if (!player) {
			throw new Error( 'Unknown player id: ' + player_id );
		}
		dojo.place( this.format_block( 'jstpl_scoretile', {
			color: player.color,
			x_y: `${x}_${y}`
		} ) , `square_${x}_${y}` );
		this.placeOnObject( `scoretile_${x}_${y}`, `overall_player_board_${player_id}` );
		this.slideToObject( `scoretile_${x}_${y}`, `square_${x}_${y}` ).play();
	}

	addPatternOnBoard(pattern: string, x: number, y: number, player_id: string) {
		console.log(`Adding pattern at position (${x}, ${y}):`, pattern);
		const player = this.gamedatas.players[ parseInt(player_id) ];
		if (!player) {
			throw new Error( 'Unknown player id: ' + player_id );
		}
		let patternType = pattern.substring(0,3);
		let x_pos = x;
		let y_pos = y;
		switch (patternType) {
			case ('row'):
				switch (pattern.substring(4)) {
					case ('1'):
						x_pos += 2;
						break;
					case ('2'):
						x_pos += 1;
						break;
					case ('3'):
						x_pos += 0;
						break;
					case ('4'):
						x_pos += -1;
						break;
					case ('5'):
						x_pos += -2;
						break;
					default:
						console.log("row pattern code does not match");
						return;
				}
				break;
			case ('col'):
				switch (pattern.substring(4)) {
					case ('1'):
						y_pos += 2;
						break;
					case ('2'):
						y_pos += 1;
						break;
					case ('3'):
						y_pos += 0;
						break;
					case ('4'):
						y_pos += -1;
						break;
					case ('5'):
						y_pos += -2;
						break;
					default:
						console.log("col pattern code does not match");
						return;
				}
				break;
			case ('nwd'):
				switch (pattern.substring(4)) {
					case ('1'):
						x_pos += 2;
						y_pos += 2;
						break;
					case ('2'):
						x_pos += 1;
						y_pos += 1;
						break;
					case ('3'):
						x_pos += 0;
						y_pos += 0;
						break;
					case ('4'):
						x_pos += -1;
						y_pos += -1;
						break;
					case ('5'):
						x_pos += -2;
						y_pos += -2;
						break;
					default:
						console.log("nwd pattern code does not match");
						return;
				}
				break;
			case ('ned'):
				switch (pattern.substring(4)) {
					case ('1'):
						x_pos += -2;
						y_pos += 2;
						break;
					case ('2'):
						x_pos += -1;
						y_pos += 1;
						break;
					case ('3'):
						x_pos += 0;
						y_pos += 0;
						break;
					case ('4'):
						x_pos += 1;
						y_pos += -1;
						break;
					case ('5'):
						x_pos += 2;
						y_pos += -2;
						break;
					default:
						console.log("ned pattern code does not match");
						return;
				}
				break;
			case ('pls'):
				switch (pattern.substring(4)) {
					case ('W'):
						x_pos += 1;
						y_pos += 0;
						break;
					case ('N'):
						x_pos += 0;
						y_pos += 1;
						break;
					case ('C'):
						x_pos += 0;
						y_pos += 0;
						break;
					case ('E'):
						x_pos += -1;
						y_pos += 0;
						break;
					case ('S'):
						x_pos += 0;
						y_pos += -1;
						break;
					default:
						console.log("pls pattern code does not match");
						return;
				}
				break;
			case ('crs'):
				switch (pattern.substring(4)) {
					case ('NW'):
						x_pos += 1;
						y_pos += 1;
						break;
					case ('NE'):
						x_pos += -1;
						y_pos += 1;
						break;
					case ('CE'):
						x_pos += 0;
						y_pos += 0;
						break;
					case ('SE'):
						x_pos += -1;
						y_pos += -1;
						break;
					case ('SW'):
						x_pos += 1;
						y_pos += -1;
						break;
					default:
						console.log("crs pattern code does not match");
						return;
				}
				break;
			default:
				console.log("pattern code does not match");
				return;
		}

		dojo.place( this.format_block( 'jstpl_pattern', {
			color: player.color,
			x_y: `${x_pos}_${y_pos}`,
			type: patternType
		} ) , `board` );
		const patternElement = <HTMLElement>$(`pattern_${x_pos}_${y_pos}_${patternType}`);
		this.placeOnObject( patternElement, `square_${x_pos}_${y_pos}` );
		patternElement.classList.add('flash'); // Add flash effect
		//element.style.opacity = 1; // Ensure full opacity

		// After the flash animation completes, start the fade out
		setTimeout(() => {
			patternElement.classList.remove('flash'); // Remove flash effect
			patternElement.classList.add('fade-out'); // Start fade out
		}, 2000); // Time to match the flash animation duration
	}

	// Returns true if id is a wild
	isWild(id: number) {
		return (id >= 1 && id <= RivalX.MAX_WILDS);
	  }

	///////////////////////////////////////////////////
	//// Player's action
	
	onsquareClick( evt: Event )
	{
		// Stop this event propagation
		evt.preventDefault();

		if (!(evt.currentTarget instanceof HTMLElement))
			throw new Error('evt.currentTarget is null! Make sure that this function is being connected to a DOM HTMLElement.');

		let [_square_, x, y] = evt.currentTarget.id.split('_');
		if (x === undefined || y === undefined) {
			throw new Error ("x or y was undefined when trying to get coordinates of square clicked on");
		}
		const token = $<HTMLElement>( `token_${x}_${y}` );
		if (token !== null) { // Check if there is already a token at this square's location
			this.onselectToken(evt); // If so, the token has also been clicked already
			return;
		}
		const square = $<HTMLElement>( `square_${x}_${y}` );
		if (square === null) {
			throw new Error('square is null! Make sure that this function is being connected to a DOM HTMLElement.');
		}
		// Check that this action is possible at this moment (shows error dialog if not possible)
		if( this.checkAction( 'placeToken', true ) ) {
			// Remove lastPlayed from the previous token, add it to the new one
			this.addTokenOutline(parseInt(x), parseInt(y));
			this.ajaxcall( `/${this.game_name}/${this.game_name}/placeToken.html`, {
				x, y, lock: true
			}, this, function() {} );
		} else if (this.checkAction('moveWild', true)) {
			const selected = document.querySelector('.selected');
			if (selected !== null) { // There is a selected token
				if (square.classList.contains('possibleMove')) {
					this.addTokenOutline(parseInt(x), parseInt(y));
					let [_square_, old_x, old_y] = selected.closest('[id]')!.id.split('_');
					this.ajaxcall( `/${this.game_name}/${this.game_name}/moveWild.html`, {
						old_x: old_x, old_y: old_y, new_x: x, new_y: y, lock: true
					}, this, function() {} );
				} else {
					this.showMessage(_("Wilds cannot be repositioned to create a pattern, except for an Instant Win pattern with 5 Wilds"), "error");
				}
			} else { // there is not a selected
				this.showMessage(_("Select a Wild to reposition it, or click 'Finish Turn'"), "error");
			}
		} else if (this.checkAction('placeWild')) {
			if (square.classList.contains('possibleMove')) {
				this.addTokenOutline(parseInt(x), parseInt(y));
				this.ajaxcall( `/${this.game_name}/${this.game_name}/placeWild.html`, {
					x, y, lock: true
				}, this, function() {} );
			} else {
				this.showMessage(_("Wilds cannot be placed in any of the 8 tiles directly surrounding another Wild during initial placement"), "error");
			}
		}
	}

	onselectToken( evt: Event )
	{
		// Stop this event propagation
		evt.preventDefault();

		if (!(evt.currentTarget instanceof HTMLElement))
			throw new Error('evt.currentTarget is null! Make sure that this function is being connected to a DOM HTMLElement.');
		// Check that this action is possible at this moment (shows error dialog if not possible)
		if( this.checkAction( 'placeToken', true ) ) {
			this.showMessage(_("An X-piece is already placed here"), "error"); // token or x-piece??????????????
			return;
		} else if (this.checkAction('moveWild')) {
			// Get the clicked square x and y
			// Note: square id format is "square_X_Y"
			let [_square_, x, y] = evt.currentTarget.id.split('_');
			const token = $<HTMLElement>( `token_${x}_${y}` );
			if (token === null) { // Check if there is already a token at this square's location
				throw new Error("token was selected but was somehow null");
			}
			if (token.querySelector('.selectable') !== null) {
				const selected = token.querySelector('.selected');
				if (selected !== null) { // deselect the token
					selected.classList.remove('selected');
				} else {
					this.clearSelectedToken();
					token.querySelector('.selectable')!.classList.add('selected'); // select a token and update possibleMoves
					for (const wild_id in this.wildsPossibleMoves) {
						if (token.classList.contains(`wild_${wild_id}`)) {
							const possibleMoves = this.wildsPossibleMoves[wild_id];
							if (possibleMoves === undefined) {
								throw new Error("when trying to get possible moves index was undefined");
							}
							this.updatePossibleMoves(possibleMoves, 'moveWild');
							break;
						}
					}
				}
			} else {
				this.showMessage(_("This X-piece cannot be selected; only Wilds used in the pattern can be repositioned"), "error");
			}
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
		dojo.subscribe( 'moveWild', this, "notif_moveWild" );
		this.notifqueue.setSynchronous( 'moveWild', 500 );
		dojo.subscribe( 'newScores', this, "notif_newScores" );
		this.notifqueue.setSynchronous( 'newScores', 300 );
		dojo.subscribe( 'scorePattern', this, "notif_scorePattern" );
		this.notifqueue.setSynchronous( 'scorePattern', 2000 ); // TODO: adjust timings to whatever works best
		dojo.subscribe( 'removeTokens', this, "notif_removeTokens" );
		this.notifqueue.setSynchronous( 'removeTokens', 500 );
		dojo.subscribe( 'markSelectableTokens', this, "notif_markSelectableTokens" );
		this.notifqueue.setSynchronous( 'markSelectableTokens', 200 );
		dojo.subscribe( 'blockadeWin', this, "notif_blockadeWin" );
		this.notifqueue.setSynchronous( 'blockadeWin', 5000 );
		dojo.subscribe( 'instantWin', this, "notif_instantWin" ); // TODO: have some sort of animation for an instant win, and probably a sound effect too
		this.notifqueue.setSynchronous( 'instantWin', 5000 );
		dojo.subscribe( 'pointsWin', this, "notif_pointsWin" );
		this.notifqueue.setSynchronous( 'pointsWin', 5000 );
		// [name: string]: any; // Uncomment to remove type safety on notification names and arguments
		// With base Gamegui class...
		// dojo.subscribe( 'cardPlayed', this, "notif_cardPlayed" );
		// With GameguiCookbook::Common class...
		// this.subscribeNotif( 'cardPlayed', this.notif_cardPlayed ); // Adds type safety to the subscription
	}

	notif_playToken( notif: NotifAs<'playToken'> )
	{
		this.addTokenOnBoard( notif.args.x, notif.args.y, notif.args.player_id, false);
		const id = notif.args.player_id;
		if (id > RivalX.MAX_WILDS && id !== undefined) { // It is a player token
			const tokenCounter = this.remainingTokensCounter[id];
			tokenCounter!.incValue(-1);
			this.addLastPlayedToBoard(notif.args.x, notif.args.y, notif.args.lastPlayed);
			this.clearTokenOutline();
		}
	}

	notif_newScores( notif: NotifAs<'newScores'> )
	{
		for( var player_id in notif.args.scores )
		{
			let counter = this.scoreCtrl[ player_id ];
			let newScore = notif.args.scores[ player_id ];
			if (counter && newScore)
				counter.toValue( newScore );
		}
	}

	notif_moveWild( notif: NotifAs<'moveWild'> )
	{
		this.slideToObject( `token_${notif.args.old_x}_${notif.args.old_y}`, `square_${notif.args.new_x}_${notif.args.new_y}` ).play();
		const token = $<HTMLElement>( `token_${notif.args.old_x}_${notif.args.old_y}` ); // Make sure to change token id as well
		if (token === null) {
			throw new Error("When moving a wild somehow a token reference became null");
		}
		token.id = `token_${notif.args.new_x}_${notif.args.new_y}`;
		this.removeSelectable(notif.args.new_x, notif.args.new_y);
		this.addLastPlayedToBoard(notif.args.new_x, notif.args.new_y, this.getActivePlayerId());
		this.clearTokenOutline();
	}

	notif_removeTokens(notif: NotifAs<'removeTokens'>) {
		// Remove tokens
		// TODO: play animation before removing tokens?
		notif.args.forEach((token_pos) => {
			const token = $<HTMLElement>( `token_${token_pos.x}_${token_pos.y}` );
			if (token === null) {
				throw new Error("Error: token does not exist in notif_removeTokens");
			}
			this.slideToObjectAndDestroy(token, `overall_player_board_${token_pos.player_id}`);
			this.remainingTokensCounter[parseInt(token_pos.player_id)]!.incValue(1);
		});	

		// Add score tiles
		notif.args.forEach((scoretile_pos) => {
			const scoretile = $<HTMLElement>( `scoretile_${scoretile_pos.x}_${scoretile_pos.y}` );
			if (scoretile !== null) { // there is already a score tile here, should remove it at the end
				scoretile.classList.add('toDestroy');
				scoretile.id += '_toDestroy'; // change the id so we don't have multiple elements with the same id
			}
			this.addTileOnBoard(scoretile_pos.x, scoretile_pos.y, parseInt(scoretile_pos.player_id));
		});
		// Clear all scoretiles with toDestroy tag
		document.querySelectorAll('.toDestroy').forEach(element => {
		dojo.destroy(element);
		});
	}

	notif_markSelectableTokens(notif: NotifAs<'markSelectableTokens'>) {
		notif.args.forEach((token_pos) => {
			this.markSelectableToken(token_pos.x, token_pos.y);
		});
	}

	// Add pattern to board
	notif_scorePattern( notif: NotifAs<'scorePattern'> ) {
		this.addPatternOnBoard(notif.args.patternCode, notif.args.x, notif.args.y, notif.args.player_id);
	}

	notif_pointsWin() {
		console.log("Win by points!");
	}

	notif_blockadeWin() {
		console.log("blockade win!");
	}

	notif_instantWin() {
		this.clearSelectable();
		document.querySelectorAll('.tokencolor_0').forEach((element, index) => {
			element.classList.add('instant_win');
			const html_element = <HTMLElement>element;
			html_element.style.animationDelay = `${index * 1}s`;
		});
		playSound('rivalx_instant_win_sound');
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