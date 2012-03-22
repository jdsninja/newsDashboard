/*global window, console, jQuery, undef */
(function ($, undef) {
	"use strict";

	var Moza = {};
	window.Moza = Moza;

	/**
	* Define grid specification
	*/
	$.fn.showGrid = function (options) {
		var ctn = this,
			grid,
			settings = {
				stage: {
					width: this.width(),
					height: this.height(),
					spacerW: 2 * 100 / this.width(),
					spacerH: 2 * 100 / this.height()
				},
				grid: {
					width: 10,
					height: 5
				},
				/*
				The size and number of tile are controlled here
				The grid will automatically fill the space as best it can based on the numbers supplied here. You may specify a maximum amount of articles to display for each image size. Remeber to take the size of each tile into consideration when changing these values. For example, If you want more 'big' images, it's a good idea to make some room for them by limiting the 'medium' and 'small' types. Also note that 'big' takes priority over 'medium' and the same goes for 'medium' over 'small'.
				 */
				tile: {
					big : {
						max: 2,
						width: 4,
						height: 4
					},
					medium : {
						max: 10,
						width: 2,
						height: 2
					},
					small : {
						max: 10,
						width: 1,
						height: 1
					}
				},
				testMode: false,
				random: true
			},
			Coords = {
				all: [],
				free: [],
				taken: []
			},
			Items = {},
			tileWidth = '',
			tileheight = '',
			x = 0,
			y = 0;

		// Merge the default and user settings
		if (options) {
			settings = $.extend(settings, options);
		}

		// Returns the version of Internet Explorer or a -1
		// (indicating the use of another browser).
		function getInternetExplorerVersion() {
			var rv = -1; // Return value assumes failure.
			if (navigator.appName == 'Microsoft Internet Explorer') {
				var ua = navigator.userAgent;
				var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
				if (re.exec(ua) != null)
				rv = parseFloat( RegExp.$1 );
			}
			return rv;
		}

		function Coord(x, y) {
			this.x = x;
			this.y = y;
		}

		function Tile(size, callNumber) {
			var i, tile, tileSize;
			tile = this;
			tile.size = size;
			tile.width = settings.tile[size].width;
			tile.height = settings.tile[size].height;
			tile.coord = null;
			tile.targets = [];
			tile.target = [];

			/**
			* Get all coords needed to place this tile
			*/
			this.getOccupationFromCoord = function (coord) {
				var i, j, coords = [];
				if (coord !== undef) {
					for (i = 0; i < this.width; i = i + 1) {
						for (j = 0; j < this.height; j = j + 1) {
							coords.push(new Coord(i + coord.x, j + coord.y));
						}
					}
					return coords;
				}
			};

			/**
			* DOWNGRADE THE SIZE IF NO SPACE IS AVAILABLE
			*/
			this.targets = grid.checkPlacabilityOfTile(this, callNumber);
			if (_.isEmpty(this.targets)) {
				for (tileSize in settings.tile) {
					if (settings.tile[tileSize].width < this.width) {
						tile.width = settings.tile[tileSize].width;
						tile.height = settings.tile[tileSize].height;
						tile.size = tileSize;
						tile.targets = grid.checkPlacabilityOfTile(this, callNumber);
					}
				}
			}
			tile.target = this.targets[0];
		}

		Moza.Coord = Coord;
		Moza.Tile = Tile;
		Moza.Data = Tile;

		// TODO sort the array of tile size
		// tips: sort the array of tile by size. the bigger at the top. will be more easy that way when will play with loop

		function Grid(x, y) {
			var grid = this;
			grid.Coords = Coords;
			grid.tileWidth = settings.stage.width / settings.grid.width;
			grid.tileHeight = settings.stage.height / settings.grid.height;
			grid.IE = getInternetExplorerVersion();
			this.checkPlacabilityOfTile = function (tile, calNumber) {
				// Iterate across each free coordinates to test if the tile can be placed
				// var 
				var i, freeCoord, targets = [], t, coords;
				for (i = 0; i < this.Coords.free.length; i += 1) {
					freeCoord = this.Coords.free[i];
					if ((freeCoord.x + tile.width) * grid.tileWidth <= settings.stage.width && (freeCoord.y + tile.height) * grid.tileHeight <= settings.stage.height) {
						coords = tile.getOccupationFromCoord(freeCoord);
						if (this.checkAvailabilityOfCoordsFromCoord(coords)) {
							targets.push(freeCoord);
						}
					}
				}
				if (settings.random === true && calNumber !== 0) {
					this.shuffle(targets);
				}
				return targets;
			};

			this.checkAvailabilityOfCoordsFromCoord = function (coords) {
				var i, y = 0, j;
				for (j = 0; j < coords.length; j += 1) {
					i = this.Coords.free.length;
					while (i--) {
						if (this.Coords.free[i].x === coords[j].x && this.Coords.free[i].y === coords[j].y) {
							y += 1;
						}
					}
				}
				if (coords.length === y) {
					return true;
				} else {
					return false;
				}
			};
			this.putFreeCoorToTakenCoor = function (coord) {
				var i;
				for (i = 0; i < grid.Coords.free.length; i += 1) {
					if (grid.Coords.free[i].x === coord.x && grid.Coords.free[i].y === coord.y) {
						grid.Coords.free.splice(i, 1);
					}
				}
				grid.Coords.taken.push(coord);
			};

			this.shuffle = function (array) {
				var j, x, i;
				for (j, x, i = array.length; i; j = parseInt(Math.random() * i, 10), x = array[--i], array[i] = array[j], array[j] = x) {
				}
				return array;
			};

			this.build = function () {
				/*
				* Build a multi dimensional array for all the position available
				*/
				var i, j;
				for (i = 0; i < x; i += 1) {
					for (j = 0; j < y; j += 1) {
						this.Coords.all.push(new Coord(i, j));
					}
				}

				// Clone the arrayY of all position and add it to free position array.
				this.Coords.free = _.clone(this.Coords.all);
				return this.Coords;
			};

			this.showMarker = function () {
				/*
				* Show all the position in the grid
				* THIS IS ONLY FOR TEST
				*/
				var i, pointer, key, color;
				for (i = 0; i < settings.Items.length; i += 1) {
					color = '#000';
					x = grid.Coords.all[i].x * grid.tileWidth;
					y = grid.Coords.all[i].y * grid.tileHeight;
					//todo: put css in style sheet
					pointer	= $('<span class="">').css({
						'position': 'absolute',
						'background-color': '#000',
						'top': y,
						'left': x
					});
					pointer.html(grid.Coords.all[i].x + ', ' + grid.Coords.all[i].y);
					ctn.append(pointer);
				}
			};

			this.trimString = function(string, len) {
				if (string.length > len) {
					string = string.substring(0, len) + "...";
				}
				return string;
			}

			this.async_memoize = function(fn, hasher) {
				var memo = {}, args, callback, key;
				
				hasher = hasher || function (x) {
					return x;
				};
				return function () {
					args = Array.prototype.slice.call(arguments);
					callback = args.pop();
					key = hasher.apply(null, args);
					if (key in memo) {
						callback.apply(null, memo[key]);
					} else {
						fn.apply(null, args.concat([function () {
							memo[key] = arguments;
							callback.apply(null, arguments);
						}]));
					}
				};
			}

			/**
			* Get all the info about the tile. (position, size, id, title, etc.)
			*/
			this.getTileInfos = function(tile, item) {
				var infos = {}, newImageSize;
				newImageSize = grid.getImageSize(tile, item);
				infos = {
					size: tile.size,
					x: tile.target.x * grid.tileWidth * 100 / settings.stage.width,
					y: tile.target.y * grid.tileHeight * 100 / settings.stage.height,
					width: (tile.width * 100 / settings.grid.width) - settings.stage.spacerW,
					height: (tile.height * 100 / settings.grid.height) - settings.stage.spacerH,
					imgSrc: item.imgSrc,
					imgWidth: newImageSize.width,
					imgHeight: newImageSize.height,
					itemUrl: item.itemUrl,
					imageTop: 0,
					imageLeft: 0,
					categoryName: item.categoryName,
					//categorySlug: Data.items[itemNumber].categorySlug,
					categorySlug: item.categorySlug,
					title: grid.trimString(item.title, 40),
					id: item.id
				};
				return infos;
			};

			/**
			* Show tile one after the other.
			* No animation for IE8 and above
			*/
			this.showTile = function(tile, i) {
				var tileTmpl, tileCtn, animSpeed = 50;
				if (i === undefined) {
					i = 0;
				}
				tileTmpl = $("#tileTpl").tmpl(tile[i]).appendTo('#grid');
				/**
				* Remove animation for IE 8 and below because they cannot take it well. It't just to much for them.
				*/
				
					tileTmpl.css('top', tile[i].y + 1 + '%').animate({
						opacity: 'show',
						top: tile[i].y + '%'
					}, animSpeed, function() {
						if (i + 1 < tile.length) {
							grid.showTile(tile, i +1);
						} 
					});
				
				//highlight div when selected
				if(settings.activeId == tile[i].id) {
					tileTmpl.find('.selected').show(0);
				}
			}

			/**
			* Define the size of the image inside the tile
			*/
			this.getImageSize = function(tile, item) {
				var size = {}, imgW, imgH, tileW, tileH, imageNewHeight;
				// get tile with and height in pixel
				tileW = (tile.width) * settings.stage.width / settings.grid.width;
				tileH = (tile.height) * settings.stage.height / settings.grid.height;
				//try to the same width for both image and tile
				imageNewHeight = item.imgHeight * tileW / item.imgWidth;
				
				//base on that, make sure the space is all fill up with the image
				if(imageNewHeight < tileH) {
					//if not, put the same value for the height of the tile and the image
					imgW = '';
					imgH = 'height:100%;';
				} else {
					imgW = 'width:100%;';
					imgH = '';
				}
				size = {
					width: imgW,
					height: imgH
				}
				return size;
			};

			/**
			* FadeIn the image one after the other.
			*/
			this.showImage = function(tile, i) {
				var i, size = [], image, imageSize, animSpeed = 100;
				if (i === undefined) {
					i = 0;
				}
				
				if (grid.IE < 9 && grid.IE > -1) {
					//no tile animation for IE 6, 7 and 8. They cannot take it...
				} else {
					$('#grid .tile[data-id="' + tile[i].id + '"] img').animate(
						{
							opacity: 1
						}, 
						animSpeed, 
						function(){
							if (i + 1 < tile.length) {
								grid.showImage(tile, i + 1);
							}
						}
					);
				}
			}

			this.showImageAsync = this.async_memoize(function loadContentCategoryAsync(imageSrc, tile, callback) {
				$('#dImg').load(imageSrc, function (response, status, xhr) {
					callback(tile);
				});
			});

			/**
			* Place the tile in the grid.
			*/
			this.placeTiles = function () {
				var i, j, tile, size = 'medium', tileOccupationCoords, tileQueue = [];
				$('#dImg').html('');
				for (i = 0; i < settings.Items.length; i += 1) {
					if (!_.isEmpty(grid.Coords.free)) {
						if (i < settings.tile.big.max) {
							size = 'big';
						} else if (i < settings.tile.big.max + settings.tile.medium.max) {
							size = 'medium';
						} else {
							size = 'small';
						}
						tile = new Tile(size, i);
						// get all the coord neded for that tile
						tileOccupationCoords = tile.getOccupationFromCoord(tile.target);
						// remove the needed coords in the free array and put them in the taken array
						for (j = 0; j < tileOccupationCoords.length; j += 1) {
							grid.putFreeCoorToTakenCoor(tileOccupationCoords[j]);
						}
						//add info to queue
						tileQueue[i] = grid.getTileInfos(tile, settings.Items[i]);
					}
				}
				grid.showTile(tileQueue);
				grid.showImage(tileQueue);
			};
		}
		// Build the grid
		grid = new Grid(settings.grid.width, settings.grid.height);
		grid.build();
		if (settings.testMode === true) {
			grid.showMarker();
		}
		 //only for test
		grid.placeTiles();
	};
}(jQuery));