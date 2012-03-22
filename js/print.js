$(function () {
	var i, pageUrl, articleUrl, articleContent, categorySlug, articleId, categoryName, newImgSrc;
	dataUrl = 'data/';
	pageUrl = document.location.href;
	pageFragment = pageUrl.split('#');


	pageFragmentLast = pageFragment[pageFragment.length-1].split('/');
	categorySlug = pageFragmentLast[0];
	articleId = pageFragmentLast[1];
	articleUrl = dataUrl + categorySlug + '/' + articleId + '.html';

	$.ajax({
		url:  dataUrl + 'categories.json',
		type: 'GET',
		dataType: "json",
		success: function (result) {
			for (i = 0; i< result.length; i += 1) {
				if (result[i].slug == categorySlug) {
					categoryName = result[i].title;
				}
			}
			$('#data').html('').load(articleUrl, function (response, status, xhr) {
				if (status !== 'error') {
					$('#categoryName').html(categoryName);
				}
			});
		},
		error: function (result) {
			options.success(result);
		}
	});
});