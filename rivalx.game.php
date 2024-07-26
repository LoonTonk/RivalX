<?php
 /**
  *------
  * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
  * RivalX implementation : © <Your name here> <Your email address here>
  * 
  * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
  * See http://en.boardgamearena.com/#!doc/Studio for more information.
  * -----
  * 
  * rivalx.game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */


require_once( APP_GAMEMODULE_PATH.'module/table/table.game.php' );


class RivalX extends Table
{
	function __construct( )
	{
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        $this->initGameStateLabels( array( 

            //      ...
            //    "my_first_game_variant" => 100,
            //    "my_second_game_variant" => 101,
            //      ...
        ) );        
	}
	
    protected function getGameName( )
    {
		// Used for translations and stuff. Please do not modify.
        return "rivalx";
    }	

    /*
        setupNewGame:
        
        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame( $players, $options = array() )
    {    
        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar, player_tokens_left) VALUES ";
        $values = array();
        $player_token_count = 15;
        foreach( $players as $player_id => $player )
        {
            $color = array_shift( $default_colors );
            $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."','".$player_token_count."')";
        }
        $sql .= implode( ',', $values );
        $this->DbQuery( $sql );
        $this->reattributeColorsBasedOnPreferences( $players, $gameinfos['player_colors'] );
        $this->reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // Init global values with their initial values
        //$this->setGameStateInitialValue( 'my_first_global_variable', 0 );
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        //$this->initStat( 'table', 'table_teststat1', 0 );    // Init a table statistics
        //$this->initStat( 'player', 'player_teststat1', 0 );  // Init a player statistics (for all players)

        // TODO: setup the initial game situation here
        $sql = "INSERT INTO board (board_x,board_y,board_player,board_player_tile,board_selectable) VALUES ";
        $sql_values = array();
        list( $blueplayer_id, $redplayer_id ) = array_keys( $players ); //TODO: remove after testing
        for( $x=1; $x<=8; $x++ )
        {
            for( $y=1; $y<=8; $y++ )
            {
               if ($x==1 && $y==1) { //TODO: remove after testing
                    $sql_values[] = "('$x','$y','$blueplayer_id','$redplayer_id','0')";
                } else {
                    $sql_values[] = "('$x','$y','-1','-1','0')";
                }
            }
        }
        $sql .= implode( ',', $sql_values );
        self::DbQuery( $sql );

        // setup lastPlayed table
        $sql = "INSERT INTO lastPlayed (lastPlayed_x,lastPlayed_y,lastPlayed_player) VALUES ('0','0','0')";
        self::DbQuery( $sql );

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        /************ End of the game initialization *****/
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas()
    {
        $result = array();
    
        $current_player_id = $this->getCurrentPlayerId();    // !! We must only return informations visible by this player !!
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score FROM player ";
        $result['players'] = $this->getCollectionFromDb( $sql );
  
        // TODO: Gather all information about current game situation (visible by player $current_player_id).
        $sql = "SELECT board_x x, board_y y, board_player player, board_player_tile player_tile, board_selectable selectable
        FROM board";
        $result['board'] = self::getObjectListFromDB( $sql );
        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see states.inc.php)
    */
    function getGameProgression()
    {
        // TODO: compute and return the game progression

        return 0;
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////    

    // Get the complete board with a double associative array
    function getBoard()
    {
        $sql = "SELECT board_x x, board_y y, board_player player, board_player_tile player_tile, board_selectable selectable FROM board";
        return self::getDoubleKeyCollectionFromDB( $sql );
    }

    // Returns an array of all wilds on board
    function getWilds() {
        $sql = "SELECT board_x x, board_y y FROM board WHERE (board_player) IN (0)"; // Find all the spots with token id 0, i.e wild token
        $result = self::getObjectListFromDB( $sql );
        return $result;
    }

    // Returns number of wilds on board
    function getNumWilds() {
        $array = self::getWilds();
        $total = 0;
        foreach ($array as $subArray) {
            $total += count($subArray);
        }
        return $total;
    }

    // Need to notify and sql remove tokens (including token number), add point tiles, update score, make wilds selectable, highlight pattern
    // TODO: highlight pattern
    function updateBoardOnPattern($patternTokens, $board) {

        // First, separate pattern Tokens into player and non player
        $playerTokens = array();
        $wildTokens = array();
        foreach ($patternTokens as $token) {
            if ($board[$token['x']][$token['y']]['player'] == 0) { // wild
                $wildTokens[] = $token;
            } else {
                $playerTokens[] = $token;
            }
        }

        // Next, update the board table (remove tokens, add point tiles)
        $player_id = $board[$playerTokens[0]['x']][$playerTokens[0]['y']]['player'];
        $sql = "UPDATE board SET board_player = '-1', board_player_tile = '$player_id' WHERE (board_x, board_y) IN (";
        foreach($playerTokens as $token) {
            $sql .= "('".$token['x']."','".$token['y']."'),";
        }
        $sql = substr($sql, 0, -1) . ")"; // Removes the last character
        self::DbQuery( $sql );

        // Then update score for all players
        $player_ids =  array_keys($this->loadPlayersBasicInfos());  
        foreach ($player_ids as $player) {
            self::DbQuery( "UPDATE player SET player_score = (SELECT COUNT(*) AS player_tiles FROM board WHERE board_player_tile = '$player') WHERE player_id = $player" );
        }

        // update token count for player who made pattern
        self::DbQuery( "UPDATE player SET player_tokens_left = (SELECT 15 - COUNT(*) AS player FROM board WHERE board_player = '$player_id')" );

        // Make wilds selectable (if any exist)
        if (count($wildTokens) > 0) {
            $sql = "UPDATE board SET board_selectable = '1' WHERE (board_x, board_y) IN (";
            foreach($wildTokens as $token) {
                $sql .= "('".$token['x']."','".$token['y']."'),";
            }
            $sql = substr($sql, 0, -1) . ")"; // Removes the last character
            self::DbQuery( $sql );
        }

        // Notify remove tokens
        self::notifyAllPlayers( "removeTokens", "", $playerTokens);

        // Notify add point tiles
        $playerTiles = array();
        foreach ($playerTokens as $token) {
            $playerTiles[] = array('x' => $token['x'], 'y' => $token['y'], 'player_id' => $player_id);
        }
        self::notifyAllPlayers( "addScoreTiles", "", $playerTiles);

        // Notify make tokens selectable
        self::notifyAllPlayers( "markSelectableTokens", '', $wildTokens);

        // Notify update scores
        $newScores = self::getCollectionFromDb( "SELECT player_id, player_score FROM player", true );
        self::notifyAllPlayers( "newScores", "", array(
            "scores" => $newScores
        ) );
    }


    function getPatternTokens($board) {
        $sql = "SELECT lastPlayed_x x, lastPlayed_y y, lastPlayed_player player FROM lastPlayed"; // Find all the spots with token id 0, i.e wild token
        $result = self::getObjectFromDB( $sql );
        $this->dump("getPatternTokens sql response: ", $result);
        if ($result['x'] !== '0') { // If result[x] is 0 then lastplayed has not been set to a real token position yet
            return self::getPatternTokensAtxy($result['x'], $result['y'], $result['player'], $board);
        } else {
            return array();
        }
    }

    function getPatternTokensAtxy(int $x, int $y, $player_id, $board) {
        $mayBePattern = array();
        $result = array();

        // Checks for horizontal pattern
        $row = array( array(-1,0), array(1,0) );
        foreach ($row as $direction) {
            $curr_x = $x;
            $curr_y = $y;
            $continue = true;
            while ($continue) {
                $curr_x += $direction[0];
                if (($curr_x>=1 && $curr_x<=8 && $curr_y>=1 && $curr_y<=8) &&
                    $board[$curr_x][$curr_y]['player'] == $player_id || $board[$curr_x][$curr_y]['player'] == 0) { // Spot is either token of player or wild
                    $mayBePattern[] = array('x' => $curr_x, 'y' => $curr_y);
                } else { // spot is not pattern token
                    $continue = false;
                }
            }
        }
        if (count($mayBePattern) >= 4) { // 4 because we are not counting the token we started on
            $result = array_merge( $result, $mayBePattern );
        }
        $mayBePattern = []; // Clears mayBePattern

        // Checks for vertical pattern
        $col = array( array(0,-1), array(0,1) );
        foreach ($col as $direction) {
            $curr_x = $x;
            $curr_y = $y;
            $continue = true;
            while ($continue) {
                $curr_y += $direction[1];
                if (($curr_x>=1 && $curr_x<=8 && $curr_y>=1 && $curr_y<=8) &&
                    ($board[$curr_x][$curr_y]['player'] == $player_id || $board[$curr_x][$curr_y]['player'] == 0)) { // Spot is either token of player or wild
                    $mayBePattern[] = array('x' => $curr_x, 'y' => $curr_y);
                } else { // spot is not pattern token
                    $continue = false;
                }
            }
        }
        if (count($mayBePattern) >= 4) { // 4 because we are not counting the token we started on
            $result = array_merge( $result, $mayBePattern );
        }
        $mayBePattern = []; // Clears mayBePattern

/*         $directions = array(
            array( -1,-1 ), array( -1,0 ), array( -1, 1 ), array( 0, -1),array( 0, 0),
            array( 0,1 ), array( 1,-1), array( 1,0 ), array( 1, 1 )
        ); */
        if (count($result) > 0) {
            $result[] = array('x' => $x, 'y' => $y);
        }
        return $result;
    }
    // Returns a list of all possible player moves in current state (does not count moving wilds)
    function getPossibleMoves($state) {
        $board = self::getBoard();
        $result = array();
        switch ($state) {
            case 'wildPlacement':
                $directions = array(
                    array( -1,-1 ), array( -1,0 ), array( -1, 1 ), array( 0, -1),array( 0, 0),
                    array( 0,1 ), array( 1,-1), array( 1,0 ), array( 1, 1 )
                );
                for ($x = 1; $x <= 8; $x++) {
                    for ($y = 1; $y <= 8; $y++) {
                        $valid_spot = true;
                        foreach( $directions as $direction ) {
                            $current_x = $x + $direction[0];
                            $current_y = $y + $direction[1];
                            if( $current_x<1 || $current_x>8 || $current_y<1 || $current_y>8 )
                                continue; // Out of the board => stop here for this direction
                            else if ($board[$current_x][$current_y]['player'] == 0) { // This spot is a wild
                                $valid_spot = false;
                            }
                        }
                        if ($valid_spot) {
                            if( ! isset( $result[$x] ) ) {
                                $result[$x] = array();
                            }
                            $result[$x][$y] = true;
                        }
                    }
                }
                return $result;
            case 'playerTurn':
                for ($x = 1; $x <= 8; $x++) {
                    for ($y = 1; $y <= 8; $y++) {
                        if ($board[$x][$y]['player'] == -1) { //player is empty
                            // Okay => set this coordinate to "true"
                            if( ! isset( $result[$x] ) ) {
                                $result[$x] = array();
                            }
                            $result[$x][$y] = true;
                        }
                    }
                }
                return $result;
            case 'changePattern': //TODO
                return $result;
            default:
                throw new Error("get possible moves called with an invalid arg");
        }
    }

    // TODO: returns true if all players have tokens, false if any player has run out of tokens
    function allPlayersHaveTokens() {
        return true;
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Player actions
//////////// 

    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in rivalx.action.php)
    */

    function placeToken( int $x, int $y )
    {
        // Check that this player is active and that this action is possible at this moment
        self::checkAction( 'placeToken' );
        $player_id = self::getActivePlayerId();
        // Adds token to board
        $sql = "UPDATE board SET board_player = '$player_id' WHERE (board_x, board_y) IN (('$x','$y'))";
        self::DbQuery( $sql );
        // Lowers player's remaining token count
        $sql = "UPDATE player SET player_tokens_left = player_tokens_left - 1 WHERE (player_id) IN ('$player_id')";
        self::DbQuery( $sql );
        // Puts token in lastPlayed
        $sql = "UPDATE lastPlayed SET lastPlayed_x = $x, lastPlayed_y = $y, lastPlayed_player = $player_id ";
        self::DbQuery( $sql );
        // Notify
        self::notifyAllPlayers( "playToken", clienttranslate( '${player_name} plays a token' ), array(
            'player_id' => $player_id,
            'player_name' => self::getActivePlayerName(),
            'wild' => false,
            'selectable' => 0,
            'x' => $x,
            'y' => $y
        ) );
            /*
        self::notifyAllPlayers( "turnOverDiscs", '', array(
            'player_id' => $player_id,
            'prevDiscState' => $prevDiscState,
            'currDiscState' => $currDiscState,
            'turnedOver' => $turnedOverDiscs,
            'playerColors' =>$this->getIdToPlayerColors()
        ) );

        // Statistics
        self::incStat( count( $turnedOverDiscs ), "turnedOver", $player_id );
        if( ($x==1 && $y==1) || ($x==8 && $y==1) || ($x==1 && $y==8) || ($x==8 && $y==8) )
            self::incStat( 1, 'discPlayedOnCorner', $player_id );
        else if( $x==1 || $x==8 || $y==1 || $y==8 )
            self::incStat( 1, 'discPlayedOnBorder', $player_id );
        else if( $x>=3 && $x<=6 && $y>=3 && $y<=6 )
            self::incStat( 1, 'discPlayedOnCenter', $player_id );

        $newScores = self::getCollectionFromDb( "SELECT player_id, player_score FROM player", true );
        self::notifyAllPlayers( "newScores", "", array(
            "scores" => $newScores
        ) ); */
        // Then, go to the next state
        $this->gamestate->nextState( 'placeToken' );
    }

    function finishTurn() {
        self::checkAction('finishTurn');
        self::DbQuery("UPDATE board SET board_selectable = 0 WHERE board_selectable IN (('1'))");
        $this->gamestate->nextState( 'finishTurn' );
    }

    // Selects a wild to reposition TODO
    function selectWild($x, $y) {
        return;
    }

    function placeWild($x,$y) {
        self::checkAction( 'placeWild' );

        $board = self::getBoard();
        $sql = "UPDATE board SET board_player = 0, board_selectable = 1 WHERE (board_x, board_y) IN (('$x','$y'))";
        self::DbQuery( $sql );
        $numWilds = count(self::getWilds());
        self::notifyAllPlayers( "playToken", clienttranslate( '${player_name} places a wild token, ${numWildsLeft} wilds left to place' ), array(
            'player_id' => self::getActivePlayerId(),
            'player_name' => self::getActivePlayerName(),
            'numWildsLeft' => 5-$numWilds,
            'selectable' => 1,
            'x' => $x,
            'y' => $y,
            'wild' => true
        ) );

        // Mark selectable tokens
        self::notifyAllPlayers( "markSelectableTokens", '', self::getWilds());
        $this->gamestate->nextState( 'placeWild' );
    }

    // Moves the selected wild from one position to another
    function moveWild($old_x, $old_y, $new_x, $new_y) {
        self::checkAction('moveWild');

    }
    /*
    
    Example:

    function playCard( $card_id )
    {
        // Check that this is the player's turn and that it is a "possible action" at this game state (see states.inc.php)
        $this->checkAction( 'playCard' ); 
        
        $player_id = $this->getActivePlayerId();
        
        // Add your game logic to play a card there 
        ...
        
        // Notify all players about the card played
        $this->notifyAllPlayers( "cardPlayed", clienttranslate( '${player_name} plays ${card_name}' ), array(
            'player_id' => $player_id,
            'player_name' => $this->getActivePlayerName(),
            'card_name' => $card_name,
            'card_id' => $card_id
        ) );
          
    }
    
    */

    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */

    function argwildPlacement() {
        return array(
            'possibleMoves' => self::getPossibleMoves('wildPlacement'),
            'numWildsLeft' => 5-count(self::getWilds())
        );
    }

    function argPlayerTurn() {
        return array( 'possibleMoves' => self::getPossibleMoves('playerTurn'));
    }

    function argChangePattern() {
        return array( 'possibleMoves' => self::getPossibleMoves('changePattern'));
    }
    /*
    
    Example for game state "MyGameState":
    
    function argMyGameState()
    {
        // Get some values from the current game situation in database...
    
        // return values:
        return array(
            'variable1' => $value1,
            'variable2' => $value2,
            ...
        );
    }    
    */

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */
    
    function stNextPlayer() { //TODO: add a LOT of checks
        $board = self::getBoard();
        $patternTokens = self::getPatternTokens($board);
        if (count($patternTokens) > 0) { // A pattern has been made!
            $this->dump("pattern Tokens ", $patternTokens);
            self::updateBoardOnPattern($patternTokens, $board); // Need to notify and sql remove tokens (including token number), add point tiles, update score, make wilds selectable, highlight pattern
           $this->gamestate->nextState('changePattern');
        }
        else if (!self::allPlayersHaveTokens()) {
            $this->gamestate->nextState('endGame');
        } else {
            self::activeNextPlayer();
            $this->gamestate->nextState( 'nextTurn' );
        }
    }
    /*
    
    Example for game state "MyGameState":

    function stMyGameState()
    {
        // Do some stuff ...
        
        // (very often) go to another gamestate
        $this->gamestate->nextState( 'some_gamestate_transition' );
    }    
    */

//////////////////////////////////////////////////////////////////////////////
//////////// Zombie
////////////

    /*
        zombieTurn:
        
        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).
        
        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message. 
    */

    function zombieTurn( $state, $active_player )
    {
    	$statename = $state['name'];
    	
        if ($state['type'] === "activeplayer") {
            switch ($statename) {
                default:
                    $this->gamestate->nextState( "zombiePass" );
                	break;
            }

            return;
        }

        if ($state['type'] === "multipleactiveplayer") {
            // Make sure player is in a non blocking status for role turn
            $this->gamestate->setPlayerNonMultiactive( $active_player, '' );
            
            return;
        }

        throw new feException( "Zombie mode not supported at this game state: ".$statename );
    }
    
///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:
        
        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.
    
    */
    
    function upgradeTableDb( $from_version )
    {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
        
        // Example:
//        if( $from_version <= 1404301345 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//        }
//        if( $from_version <= 1405061421 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//        }
//        // Please add your future database scheme changes here
//
//


    }    
}
