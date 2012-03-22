/*global window, console, jQuery, Backbone, Dashboard*/
(function ($, Backbone) {
	"use strict";
	var Dashboard, dashboard;
	Backbone.sync = function (method, model, options) {
		$.ajax({
			url: model.url,
			type: 'GET',
			dataType: "json",
			success: function (result) {
				options.success(result);
			},
			error: function (result) {
				options.success(result);
			}
		});
	};

	Dashboard = window.Dashboard = function () {
		var dashboard = this, Router;
		dashboard.dataUrl = 'data/';
		dashboard.imagesUrl = 'data/';
		dashboard.articleId = '';
		dashboard.leftPanelContentCtn = $("#dashboard #dCcontent div");
		function showCategories() {
			var categoriesView = new dashboard.Views.Categories({
				collection: dashboard.collection.categories
			});
			return categoriesView;
		}

		function start() {
			Backbone.history.start();
			showCategories();
		}

		function init() {
			$(window).ready(function () {
				var categories	= new dashboard.Collections.Categories();
				dashboard.collection.categories	= categories;
				categories.fetch({
					success: function (response) {
						start();
					}
				});
			});
		}

		function getActiveCategoryId() {
			var i, urlFragments, selectedCategory, categoryId, category, urlLength;
			//get slug
			urlFragments = Backbone.history.getFragment().split('/');
			urlLength = urlFragments.length;
			
			if (urlLength > 2) {
				//this is a allstories / selected category pag
				dashboard.pageSlug = urlFragments[0];
				//dashboard.pageNumber = urlFragments[urlLength - 1];
				dashboard.articleId	= urlFragments[1];
			} else {
				dashboard.pageSlug = urlFragments[0];
				dashboard.articleId	= urlFragments[1];
			}

			if (dashboard.pageSlug === 'all-stories') {
				dashboard.pageSlug = dashboard.articleId;
			} else {
				dashboard.articleId	= urlFragments[1];
			}
			//get active category id base on the slug
			for (i = 0; i < dashboard.collection.categories.models.length; i += 1) {
				selectedCategory = dashboard.collection.categories.models[i];
				if (selectedCategory.attributes.slug === dashboard.pageSlug) {
					categoryId = selectedCategory.id;
				}
			}
			return categoryId;
		}

		function getCategoryAttributes() {
			var i, category, models, categoryAttributes, categoryId;
			models = dashboard.collection.categories.models;
			categoryId = getActiveCategoryId();
			for (i = 0; i < models.length; i += 1) {
				if (categoryId === models[i].id) {
					categoryAttributes = models[i].attributes;
				}
			}
			return categoryAttributes;
		}

		function activateCategoryLnk(className) {
			var categoryAttributes, selector;
			$("#dashboard #dMainHeader h1, #dashboard #dMainHeader ul li").removeClass('active');
			if (className === 'home') {
				$("#dashboard #dMainHeader h1").addClass('active');
			} else if (className === 'archive') {
				$("#dMainHeader .allStories").addClass('active');
			} else {
				categoryAttributes = getCategoryAttributes();//todo use la fonction de underscore pour cacher le resultat
				$("#dashboard header nav li, #dashboard header h1").removeClass('active');
				if (categoryAttributes !== undefined) {
					selector = $("#dashboard li[data-id='" + categoryAttributes.id + "']");
					selector.addClass('active');
					selector.find("#toolTips").hide(0);
				}
			}
		}

		function renderTemplate(template, target, data) {
			$(template).tmpl(data).appendTo($(target));
		}

		function storeViewHistory(name) {
			/**
			* Keep the last view in history
			*/
			if (dashboard.viewHistory.length > 1) {
				dashboard.viewHistory.splice(0, 1);
			}
			dashboard.viewHistory.push(name);
		}

		function getPagesInfos(target, data, colPerPage, itemPerCol) {
			var pagesInfos = {};
			pagesInfos.count = Math.ceil(data.length / itemPerCol / colPerPage);
			pagesInfos.defaultWidth = $(target).width();
			pagesInfos.width = pagesInfos.defaultWidth * pagesInfos.count;
			return pagesInfos;
		}

		function getPageId() {
			var urlFragments, pageId;
			urlFragments = Backbone.history.getFragment().split('/');
			pageId = parseInt(urlFragments[urlFragments.length - 1]);
			if (isNaN(pageId) || urlFragments.length < 3) {
				pageId = 1;
			}
			return pageId;
		}

		function showPagination(template, target, pageCount, pageSlug) {
			var i, link;
			for (i = 1; i <= pageCount; i += 1) {
				renderTemplate(template, target, {pageNumber: i, pageSlug: pageSlug});
			}
			$('#dashboard .pagination a[data-id="' + getPageId() + '"]').addClass('active');
		}

		function enablePagination(itemTemplate, data, itemPerCol, colPerPage, pageSlug, categorySlug) {
			//#dArticleContent', '#associateTpl' articleContent, 5, 3);
			var i, colId = 0, pageInfos = {}, pagePosition, colCount, ctn = $('#dItemsCtn'), target = $('#dItems'), pageCount, pageDefaultWidth, pageWidth, colTotalCount, colWidth;
			
			if (categorySlug !== undefined) {
				pageSlug = categorySlug + '/' + pageSlug;
			}

			pageCount = Math.ceil(data.length / colPerPage / itemPerCol);
			pageDefaultWidth = ctn.width();
			pageWidth = pageDefaultWidth * pageCount;
			colTotalCount = colPerPage * pageCount;
			colWidth = pageWidth / colTotalCount;
			// change the width of the container
			target.width(pageWidth);
			//insert the column
			for (i = 0; i < colTotalCount; i += 1) {
				renderTemplate('#columnTpl', target, {id: i, width: colWidth + 'px', height: '100%'});
			}
			//insert the item in the column
			for (i = 0; i < data.length; i += 1) {
				if (i % itemPerCol === 0 && i > 0) {
					colId = colId + 1;
				}
				renderTemplate(itemTemplate, target.find('.column[data-id="' + colId + '"]'), data[i]);
			}
			//show the pagination 
			if (pageCount > 1) {
				showPagination('#paginationTpl', '#dashboard #dCcontent .pagination', pageCount, pageSlug);
			}
			
			pagePosition = ((getPageId() - 1) * pageDefaultWidth) * -1;
			/*if (dashboard.pageNumber > 1) {
				pagePosition = pagePosition;
			}*/
			//move the container to the selected page
			target.css('margin-left', pagePosition).css('opacity', 0).delay(250).animate({'opacity' : 1}, 250, 'easeOutQuart');
		}

		function resetStage(className, x, y, random) {
			activateCategoryLnk(className);
			$("#dashboard").removeClass().addClass(className);
			if (dashboard.viewHistory[0] === dashboard.viewHistory[1] && className !== 'category') {
				if (className !== undefined && className !== 'home') {
					dashboard.leftPanelContentCtn.html('');
				}
			} else {
				//activate category btn
				//remove old content
				$("#grid .tile").stop();
				$("#grid").html('');
				if (x !== undefined) {
					if (random === undefined) {
						random = true;
					}
					if (className === 'category') {
						$('#grid').showGrid({
							grid: {
								'width': x,
								'height': y
							},
							Items: dashboard.articles,
							random: random,
							tile: {
								big : {
									'max': 1,
									'width': 4,
									'height': 4
								},
								medium : {
									'max': 6,
									'width': 2,
									'height': 2
								},
								small : {
									'max': 10,
									'width': 1,
									'height': 1
								}
							}
						});
					} else if (className === 'home') {
						$('#grid').showGrid({
							grid: {
								'width': x,
								'height': y
							},
							Items: dashboard.articles,
							random: random
						});

					} else {
						$('#grid').showGrid({
							grid: {
								'width': x,
								'height': y
							},
							Items: dashboard.articles,
							random: random,
							activeId: dashboard.articleId
						});
					}
				}
			}
		}

		function getCollections() {
			var collections = {};
			collections.Categories = Backbone.Collection.extend({
				url: dashboard.dataUrl + 'categories.json'
			});
			return collections;
		}

		function buildArticleObject(articles) {
			var articleList = [], dateString, myDate, categoryAttributes, categoryName, categoryId, categorySlug, selector, categoryActiveId, itemUrl;
			categoryActiveId = getActiveCategoryId();
			categoryAttributes = getCategoryAttributes();

			$.each(articles, function (key, value) {
				selector = $(this);
				dateString = selector.find('time').attr('datetime');  // mm/dd/yyyy [IE, FF]
				myDate = new Date(dateString);

				categoryId = $(this).data('categoryid');
				categorySlug = $(this).data('categoryslug');
				if (categoryActiveId === undefined && categoryId !== undefined) {
					categoryAttributes = dashboard.collection.categories.models[categoryId - 1].attributes;
				}
				
				//Build article url
				if (categorySlug !== undefined) { 
					itemUrl = categorySlug;
				} else {
					itemUrl = categoryAttributes.slug + '/' + selector.data('id');
				}
				articleList.push({
					id: selector.data('id'),
					title: selector.find('h1').text(),
					categoryID: categoryId,
					categoryName: categoryAttributes.title,
					categorySlug: categoryAttributes.slug,
					itemUrl: itemUrl,
					preview: selector.find('.preview').html(),
					date: myDate,
					dateFormated: selector.find('time').html(),
					imgSrc: selector.data('imgsrc'),
					imgWidth: selector.data('imgwidth'),
					imgHeight: selector.data('imgheight'),
					content: selector.find('.content').html()
				});
			});
			return articleList;
		}

		function getArticles(type) {
			var articles;
			/**
			* Get related article by category id
			*/
			articles = $('#data #' + type).find('article');
			return buildArticleObject(articles);
		}

		function slidePanel(left, width) {
			var animSpeed = 300, animatedElement = {};
			if (dashboard.viewHistory[0] !== dashboard.viewHistory[1]) {
				if (width === undefined) {
					animatedElement = {left : left + '%'}
				} else {
					animatedElement = {left : left + '%', width : width + '%'}
				}
				$('#dCcontent').animate(animatedElement, 700, 'easeOutQuart', function () {
					if (left > 100) {
						//dashboard.leftPanelContentCtn.html('');
					} else {
						dashboard.leftPanelContentCtn.animate({opacity: 1}, animSpeed);
					}
				});
			} else {
				dashboard.leftPanelContentCtn.animate({opacity: 1}, animSpeed);
			}
		}

		function loadRelatedContent(view, url) {
			var animSpeed = 100;
			url = dashboard.dataUrl + url;
			dashboard.leftPanelContentCtn.animate({opacity:0}, animSpeed, function() {
				dashboard.leftPanelContentCtn.html('');
				loadRelatedContentAsync(url, view, function(articles) {
					if (status !== 'error') {
						dashboard.articles = articles;
						view.render();
					}
				});
			});
		}

		var loadRelatedContentAsync = async_memoize(function loadRelatedContentAsync(url, view, callback) {
			var articles;
			$('#data #related').html('').load(url + '.html', function (response, status, xhr) {
				articles = getArticles('related');
				callback(articles);
			});
		});

		/**
		 *
		 */
		function async_memoize(fn, hasher) {
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
		* Show article
		*/
		function showArticle(article, printLnk) {
			var i, pageCount, contentHolderWidth, content, spaceBetweenColumn, pagePosition, activePageNumber, moreLnkCount, /*useColumnize = false,*/ videoid;

			renderTemplate("#articleTpl", "#dashboard #dCcontent div", article[0]);

			//on hold
			//videoid = $('#article .content .figure').data('videoid'); 
			content = $('#article .content').html();
			$('#printBtn').attr('href', printLnk);

			moreLnkCount = content.split('<span class="separator"></span>').length;
		 	pageCount = moreLnkCount;
		 	content = content.split('<span class="separator"></span>');
			

			spaceBetweenColumn = pageCount * 20; //padding-right = 20px;
			contentHolderWidth = pageCount * 540 + spaceBetweenColumn;
			
			


			$('#dCcontent h1').html($('#article h1').html());//tit twist pour faire afficher le tite sur ie7 et 8 todo: trouver une autre mani'ere de faire.
			$('#dItems').width(contentHolderWidth);

			//split the page into several pages
			for (i = 0; i < content.length; i += 1) {
				$('#dItems').append('<div class="column" style="float:left;">' + content[i] + '</div>');
			}
			
			//on hold
			//show video if exist
			/*if (videoid !== undefined) {
				renderTemplate("#articleVideoTpl", "#dItems .figure", {videoid: videoid});
				brightcove.createExperiences();
			}*/
			
			
			//get category slug (todo)
			var categorySlug = $('.infos .category').html().toLowerCase();
			
			//Show pagination and created more then one if needed
			if (pageCount > 1){
				//Show pagination and activate the current page number
				showPagination('#paginationTpl', '#dashboard #dCcontent .pagination', pageCount, categorySlug+'/'+dashboard.articleId);
				activePageNumber = getPageId() - 1;
				pagePosition = activePageNumber * 540 + activePageNumber * 20;
				pagePosition = pagePosition * -1;
				$('#dItems').css('margin-left', pagePosition);
			}
		}

		/**
		* Show new associates
		*/
		function showNewAssociates(article) {
			$('#dashboard').addClass('new-associates');
			renderTemplate("#articleTpl", "#dashboard #dCcontent div", {title: 'New Associates', content: ''});
			enablePagination('#associateTpl', article, 5, 3, 'associates/new-associates');
		}

		function getRouter() {
			var Router = Backbone.Router.extend({
				routes: {
					"": "index",
					"home": "index",
					"products": "category",
					"products/:id": "article",
					"associates": "category",
					"associates/new-associates/page/:number": "article",
					"associates/:id": "article",
					"culture": "category",
					"culture/:id": "article",
					"reputation": "category",
					"reputation/:id": "article",
					"effectiveness": "category",
					"effectiveness/:id": "article",
					"growth": "category",
					"growth/:id": "article",
					"contribute": "contribute",

					"products/:articleId/page/:number": "article",
					"associates/:articleId/page/:number": "article",
					"culture/:articleId/page/:number": "article",
					"reputation/:articleId/page/:number": "article",
					"effectiveness/:articleId/page/:number": "article",
					"growth/:articleId/page/:number": "article",

					"all-stories": "archive",
					"all-stories/page/:number": "archive",
					"all-stories/:categorySlug": "archive",
					"all-stories/:categorySlug/page/:pageId": "archive"
				},
				initialize: function () {
				},
				index: function () {
					dashboard.dashboardView = new dashboard.Views.Index();
				},
				contribute: function () {
					dashboard.dashboardView = new dashboard.Views.Contribute();
				},
				category: function () {
					dashboard.dashboardView = new dashboard.Views.Category();
				},
				article: function () {
					dashboard.dashboardView = new dashboard.Views.Article();
				},
				archive: function () {
					dashboard.dashboardView = new dashboard.Views.Archive();
				}
			});
			return Router;
		}

		function getViews() {
			var Views = {};
			Views.Categories = Backbone.View.extend({
				//this is called when the app start
				initialize: function () {
					var i, $header, models, category;
					dashboard.leftPanelContentCtn.html('');
					$header = $("header ul");
					models = this.collection.models;
					for (i = 0; i < models.length; i += 1) {
						renderTemplate("#categoryLinkTpl", $header, models[i].attributes);
					}
					//categories links actions
					$("#dashboard header nav a").live("mouseover mouseout", function (event) {
						var lnkCtn = $(this).parent();
						if (event.type === "mouseover") {
							lnkCtn.find("#toolTips").show(0);
						} else if (event.type === "mouseout") {
							lnkCtn.find("#toolTips").hide(0);
						}
					});
				}
			});

			Views.Index = Backbone.View.extend({
				initialize: function () {
					storeViewHistory('home');
					loadRelatedContent(this, 'home');
				},
				render: function () {
					resetStage('home', 8, 8);
					//anime panel
					slidePanel(101);
				}
			});

			Views.Contribute = Backbone.View.extend({
				initialize: function () {
					storeViewHistory('contribute');
					this.render();
				},
				render: function () {
					resetStage('contribute');
					renderTemplate("#contributeTpl", "#dashboard #dCcontent div");
					//anime panel
					slidePanel(-0.2, 101);
				}
			});
			
			Views.Category = Backbone.View.extend({
				initialize: function () {
					storeViewHistory('category');
					this.categoryAttributes = getCategoryAttributes();//todo use la fonction de underscore pour cacher le resultat
					//Load related article
					loadRelatedContent(this, this.categoryAttributes.slug);
				},
				render: function () {
					//Reset grid
					resetStage('category', 6, 8);
					//Load category definition
					renderTemplate("#categoryTpl", "#dashboard #dCcontent div", this.categoryAttributes);
					//Slide the panel
					slidePanel(76, 24);
				}
			});

			Views.Article = Backbone.View.extend({
				initialize: function () {
					storeViewHistory('article');
					this.categoryAttributes = getCategoryAttributes();//todo use la fonction de underscore pour cacher le resultat
					//Load related article
					loadRelatedContent(this, this.categoryAttributes.slug);
				},
				render: function () {
					var articleContent, articleUrl, view, printUrl;
					view = this;
					//Reset grid
					resetStage('article', 1, 7, false);
					articleUrl = dashboard.dataUrl + view.categoryAttributes.slug + '/' + dashboard.articleId + '.html';
					// get article content
					$('#data #article').html('').load(articleUrl, function (response, status, xhr) {
						if (status !== 'error') {
							// exception for a special section. the layout is different for this one.
							articleContent = getArticles('article');
							if (dashboard.articleId !== 'new-associates') {
								//default article page
								printUrl = 'print.html#' + view.categoryAttributes.slug + '/' + dashboard.articleId;
								showArticle(articleContent, printUrl);
								//shadowBox({multi:true});

							} else {
								//new associates pages
								showNewAssociates(articleContent);
							}
						}
					});

					//Show More Stories link
					if (dashboard.viewHistory[0] !== dashboard.viewHistory[1]) {
						renderTemplate("#moreStoriesLinkTpl", "#grid", {categoryName : this.categoryAttributes.title, categorySlug : this.categoryAttributes.slug});
					}

					$('#grid .tile').find('.selected').hide(0);
					$('#grid .tile[data-id="' + dashboard.articleId + '"]').find('.selected').show(0);

					//Slide the panel
					slidePanel(14.2, 85.5);
					
				}
			});

			Views.Archive = Backbone.View.extend({
				initialize: function () {
					var dataUrl;
					storeViewHistory('archive');
					this.categoryAttributes	= getCategoryAttributes();//todo use la fonction de underscore pour cacher le resultat
					if (this.categoryAttributes === undefined) {
						dataUrl = 'allStories';
					} else {
						dataUrl = this.categoryAttributes.slug + 'All';
					}
					//load related article
					loadRelatedContent(this, dataUrl);
					//loadContentCategory(this, dataUrl, 'related');
				},
				render: function () {
					var i, models, categorySlug;
					//todo: create the new catalogue article here and not in the router.
					resetStage('archive');
					renderTemplate("#archiveTpl", "#dashboard #dCcontent div", {title : 'All Stories'});
					models = dashboard.collection.categories.models;
					for (i = 0; i < models.length; i += 1) {
						// preselect
						if (this.categoryAttributes === models[i].attributes) {
							models[i].attributes.selected = 'selected=selected';
						}
						renderTemplate("#archiveCategoryTpl", "#dashboard #dCcontent select", models[i].attributes);
					}
					
					$('#dCcontent select option').removeAttr("selected");
					categorySlug = 'all-stories';
					if (this.categoryAttributes !== undefined) {
						
						$('#dCcontent select option[data-id="' + this.categoryAttributes.id + '"]').attr("selected", "selected");
						categorySlug = categorySlug + '/' + this.categoryAttributes.slug;
					}
					else{$('#dCcontent select').val("0");}

					enablePagination('#archiveArticleTpl', dashboard.articles, 7, 2, categorySlug);
					slidePanel(-0.2, 101);
				}
			});
			return Views;
		}
		Router = getRouter();
		dashboard.Views = getViews();
		dashboard.Collections = getCollections();
		dashboard.Router = new Router();
		dashboard.collection = {};
		dashboard.viewHistory = [];
		init();
	};
}(jQuery, Backbone));

$(function () {
	Dashboard = new Dashboard();

	/**
	* Tool tips that appear on roll over of both header menu and tile
	* todo: need to put this in moza.js and make is more flexible so dashboard can re-use it easly
	*/
	tooltips = $("#toolTips");
	function showToolTips(element, title, category) {
		var position = element.position(),
		tileW = element.width(), tileH = element.height(), left, top, delay;
		tooltips.css({'width':"auto"});
		tooltips.find(".category").html(category);
		tooltips.find(".title").html(title);
		tooltips.show().css({'visibility':'visible','width':tooltips.width()+"px"});
		left = position.left + tileW/2 - tooltips.width()/2 - 7;
		if($.browser.webkit) left = Math.round(left);

		if (category === '') { 
			tooltips.find('.category').hide(0);
			top = '50px';
			delay = 500;
		} else {
			tooltips.find('.category').show(0);
			top = position.top + tileH + $('#dMainHeader').height() + 16;
		}

		tooltips.css('left', left).css('top', top).delay(delay).animate({
			opacity: 1
		}, 0);
	}
	
	$("#grid .tile.small a").live("mouseenter", function(event) {
		var tile = $(this).parent();
		showToolTips(tile, tile.find('.title').html(), tile.find('.category').html());
	});

	$("#dMainHeader li a").live("mouseenter", function(event) {
		var link = $(this);
		showToolTips(link, link.data('preview'), '');
	});

	$("#grid .tile.small a, #dMainHeader li a").live("mouseout click", function(event) {
		tooltips.stop().css({'opacity':0, 'visibility': 'hidden'});
	});

	$("#toolTips, .tile.medium, .tile.big").hover(function(){
		tooltips.css('opacity', 0).css('visibility', 'hidden');
	});
});