var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("bgagame/rivalx", ["require", "exports", "ebg/core/gamegui", "ebg/counter"], function (require, exports, Gamegui) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RivalX = (function (_super) {
        __extends(RivalX, _super);
        function RivalX() {
            var _this = _super.call(this) || this;
            _this.numWilds = 0;
            console.log('rivalx constructor');
            return _this;
        }
        RivalX.prototype.setup = function (gamedatas) {
            console.log("Starting game setup");
            for (var i in gamedatas.board) {
                var square = gamedatas.board[i];
                if (square !== undefined && square.player != -1) {
                    this.addTokenOnBoard(square.x, square.y, square.player, square.player == 0);
                }
                if (square !== undefined && square.player_tile != -1) {
                    console.log("square is " + square + " square.player_tile is " + square.player_tile);
                    this.addTileOnBoard(square.x, square.y, square.player_tile);
                }
            }
            dojo.query('.square').connect('onclick', this, 'onplaceToken');
            this.setupNotifications();
            console.log("Ending game setup");
        };
        RivalX.prototype.onEnteringState = function (stateName, args) {
            console.log('Entering state: ' + stateName);
        };
        RivalX.prototype.onLeavingState = function (stateName) {
            console.log('Leaving state: ' + stateName);
        };
        RivalX.prototype.onUpdateActionButtons = function (stateName, args) {
            console.log('onUpdateActionButtons: ' + stateName, args);
            if (this.isCurrentPlayerActive()) {
                switch (stateName) {
                    case 'wildPlacement':
                        if ((args === null || args === void 0 ? void 0 : args.numWilds) !== undefined && args.numWilds >= 5) {
                            console.log("should add button now");
                            this.addActionButton('finishTurn_button', _('Finish Turn'), 'onfinishTurn');
                        }
                        break;
                }
            }
        };
        RivalX.prototype.addTokenOnBoard = function (x, y, player_id, wild) {
            if (wild) {
                dojo.place(this.format_block('jstpl_token', {
                    color: 0,
                    x_y: "".concat(x, "_").concat(y)
                }), 'board');
            }
            else {
                var player = this.gamedatas.players[player_id];
                if (!player) {
                    throw new Error('Unknown player id: ' + player_id);
                }
                dojo.place(this.format_block('jstpl_token', {
                    color: player.color,
                    x_y: "".concat(x, "_").concat(y)
                }), 'board');
            }
            if (player_id != 0) {
                this.placeOnObject("token_".concat(x, "_").concat(y), "overall_player_board_".concat(player_id));
                this.slideToObject("token_".concat(x, "_").concat(y), "square_".concat(x, "_").concat(y)).play();
            }
            else {
                this.placeOnObject("token_".concat(x, "_").concat(y), "square_".concat(x, "_").concat(y));
            }
        };
        RivalX.prototype.addTileOnBoard = function (x, y, player_id) {
            var player = this.gamedatas.players[player_id];
            if (!player) {
                throw new Error('Unknown player id: ' + player_id);
            }
            var square = $("square_".concat(x, "_").concat(y));
            square === null || square === void 0 ? void 0 : square.classList.add("squarecolor_".concat(player.color));
        };
        RivalX.prototype.onplaceToken = function (evt) {
            evt.preventDefault();
            if (!(evt.currentTarget instanceof HTMLElement))
                throw new Error('evt.currentTarget is null! Make sure that this function is being connected to a DOM HTMLElement.');
            if (this.checkAction('placeToken', true)) {
                var _a = evt.currentTarget.id.split('_'), _square_ = _a[0], x = _a[1], y = _a[2];
                var token = $("token_".concat(x, "_").concat(y));
                if (token !== null) {
                    this.showMessage("Cannot play here, there is already a token", "error");
                    return;
                }
                this.ajaxcall("/".concat(this.game_name, "/").concat(this.game_name, "/placeToken.html"), {
                    x: x,
                    y: y,
                    lock: true
                }, this, function () { });
            }
            else if (this.checkAction('placeWild')) {
                var _b = evt.currentTarget.id.split('_'), _square_ = _b[0], x = _b[1], y = _b[2];
                var token = $("token_".concat(x, "_").concat(y));
                if (token !== null) {
                    this.showMessage("Cannot play here, there is already a token", "error");
                    return;
                }
                this.ajaxcall("/".concat(this.game_name, "/").concat(this.game_name, "/placeWild.html"), {
                    x: x,
                    y: y,
                    lock: true
                }, this, function () { });
            }
        };
        RivalX.prototype.onfinishTurn = function (evt) {
            evt.preventDefault();
            if (!(evt.currentTarget instanceof HTMLElement))
                throw new Error('evt.currentTarget is null! Make sure that this function is being connected to a DOM HTMLElement.');
            if (this.checkAction('finishTurn')) {
                this.ajaxcall("/".concat(this.game_name, "/").concat(this.game_name, "/finishTurn.html"), { lock: true }, this, function () { });
            }
        };
        RivalX.prototype.setupNotifications = function () {
            console.log('notifications subscriptions setup');
            dojo.subscribe('playToken', this, "notif_playToken");
            this.notifqueue.setSynchronous('playToken', 500);
        };
        RivalX.prototype.notif_playToken = function (notif) {
            this.addTokenOnBoard(notif.args.x, notif.args.y, notif.args.player_id, notif.args.wild);
        };
        return RivalX;
    }(Gamegui));
    dojo.setObject("bgagame.rivalx", RivalX);
});
