angular.module('starter.controllers', [])

// A simple controller that fetches a list of data from a service
.controller('ipmIndexCtrl', function($scope, IPMService, $http, $rootScope) {
	// "IPMs" is a service returning mock data (services.js)
	// Change the path depending on where the server is located. 
	var path = 'http://10.0.3.2:8080/categories';
	// var path = 'http://localhost:8080/categories';
	
	// If connection success, load data. Otherwise, use mock data.
	$http.get(path).success(function(data) 
	{
		$scope.ipms = data.content;
		console.log($scope.ipms);
	}).
	error(function(data) 
	{
		$scope.ipms = IPMService.all();
	});
	
	// Generate paths to images on web server.
	$scope.generatePath = function(str)
	{
		return "http://web9.uits.uconn.edu/ipmapp/img/" + str.toLowerCase() + ".JPG";
	}
	
	// Routing for selecting a category. Set the category in root scope.
	$scope.selectCategory = function(id)
	{
		$rootScope.category = id;
		console.log(id);
		location.href = "#/tab/ipm/" + id;
	}
})

// A simple controller that shows a tapped item's data
.controller('ipmDetailCtrl', function($scope, $stateParams, IPMService, $http, $rootScope) {
	// "IPMs" is a service returning mock data (services.js)
	
	// Change/uncomment to change server address
	var path = 'http://10.0.3.2:8080/subcategories?id=' + $rootScope.category;
	// var path = 'http://localhost:8080/subcategories?id=' + $rootScope.category;
	
	// Use mock data is connection failed. Otherwise, load retrieved list.
	$http.get(path).success(function(data) 
	{
		$scope.ipm = data.content;
		console.log($scope.ipm);
	}).
	error(function(data) 
	{
		$scope.ipm = IPMService.sub();
	});
	
	// Generate image paths
	$scope.generatePath = function(str)
	{
		return "http://web9.uits.uconn.edu/ipmapp/img/" + str.toLowerCase() + ".JPG";
	}
	
	// Routing for selecting subcategory, make sure subcategory name is saved in root scope for global use.
	$scope.selectSubcategory = function(name)
	{
		$rootScope.subcategory = name;
		console.log(name);
		location.href = "#/tab/survey";
	}
})

// Controller for the survey
.controller('ipmSurveyCtrl', function($scope, $stateParams, $http, $rootScope) {	
	// Use path depending on server address location.
	var path = 'http://10.0.3.2:8080/response?';
	// var path = 'http://localhost:8080/response?';
	// var path = 'http://web9.uits.uconn.edu/ipmapp/Admin/retrieval.php?';	
	
	// Object arrays for the selection options on quantifications
	$scope.pest = [
		{id: 1, val: "< 10"}, 
		{id: 2, val: "10 to 50"}, 
		{id: 3, val: "51 to 100"}, 
		{id: 4, val: "> 100"}
	];
	$scope.plantPe = [
		{id:1, val: "< 10%"}, 
		{id:2, val: "10%-25%"}, 
		{id:3, val: "26%-50%"}, 
		{id:4, val: "51%-75%"}, 
		{id:5, val: "76%-100%"}
	];
	$scope.plantNo = [
		{id:1, val: "1"}, 
		{id:2, val: "2-5"}, 
		{id:3, val: "6-10"}, 
		{id:4, val: "11-20"}, 
		{id:5, val: "> 20"}
	];	
	
	// Set default selections to first element in list.
	$scope.pestNumber = $scope.pest[0];
	$scope.plantPercent = $scope.plantPe[0];
	$scope.plantNumber = $scope.plantNo[0];
	
	// Initialize variables for type
	$scope.page = 0;
	$scope.leaf = {};
	$scope.fruit = {};
	$scope.bugs = {};
	$scope.branches = {};
	$scope.plant = {};
	$scope.leafReq = "";
	$scope.fruitReq = "";
	$scope.bugsReq = "";
	$scope.branchesReq = "";
	$scope.plantReq = "";
	$rootScope.ResultList = [];	
	
	// Function for changing pages
	$scope.next = function()
	{
		$scope.page++;
	}
	
	$scope.back = function()
	{
		$scope.page--;
	}
	
	// Function called when  hitting submit for the survey
	$scope.submitData = function()
	{
		// Generate the address call to the REST API on the server
		console.log("get");
		leafData();
		fruitData();
		overallData();
		branchesData();
		bugData();
		console.log($scope.leafReq);
		$scope.page++;
		path += "leaf=" + $scope.leafReq + "&fruit=" + $scope.fruitReq + "&bugs=" + $scope.bugsReq + "&branches=" + $scope.branchesReq + "&plant=" + $scope.plantReq + "&pestNum=" + $scope.pestNumber.id + "&plantPerc=" + $scope.plantPercent.id + "&plantNum=" + $scope.plantNumber.id + "&name=" + $rootScope.name;
		console.log(path);
		
		// If the server accepts the request, generate the list of responses by parsing the JSON object received from the server.
		$http.get(path).success(function(data) 
		{
            $scope.response = data.content;
			console.log(data);			
			
			angular.forEach($scope.response, function(obj, key) {				
				var i = 0;
				
				var duplicate = $scope.filterDuplicate(obj);
				if (!duplicate)
				{
					var elem = {Name: obj.name, Content: obj.text, Help: "http://en.wikipedia.org/wiki/"};
					var intermediate = elem.Name.replace("(", "").replace(")", "").split(" ");
					while ( i < intermediate.length-1)
					{
						if (i > 0)
						{
							intermediate[i] = intermediate[i].toLowerCase();
						}
						elem.Help = elem.Help + intermediate[i] + "_";
						i++;
					}
					if (i > 0)
					{
						intermediate[i] = intermediate[i].toLowerCase();
					}
					elem.Help += intermediate[i];
					$rootScope.ResultList.push(elem);					
				}
			});			
			// In the case of an empty result returned, give empty result message.
			if ($rootScope.ResultList.length < 1)
			{
				var empty = {Name: "", Content: "Sorry, no results were returned by this query."};
				$rootScope.ResultList.push(empty);
			}
			console.log($rootScope.ResultList);
        }).
		// In the case of an error, print an error mesage.
		error(function(data) 
		{
			$scope.names = "Sorry, no connection with the server could be established. Please try again later."
		});
	}
	
	// Filter out duplicate pest entries if they exist
	$scope.filterDuplicate = function(obj)
	{		
		var add = false;
		angular.forEach($rootScope.ResultList, function(elem) {			
			if (elem.Name == obj.name)
			{					
				add = true;
			}
		});
		return add;
	}
	
	$scope.back = function()
	{
		$scope.page--;
	}
	
	// Reset the survey
	$scope.restart = function()
	{
		$scope.page = 0;
		window.location.href = '/#/tab/home';
	}
	
	// Functions that collect the survey inputs and use them to construct the parameter sent to the REST API.
	var leafData = function()
	{
		if ($scope.leaf.discolored)
		{
			$scope.leafReq += "1,";
		}
		if (!$scope.leaf.discolored)
		{
			$scope.leafReq += "0,";
		}
			
		if ($scope.leaf.holes)
		{
			$scope.leafReq += "1,";
		}
		if (!$scope.leaf.holes)
		{
			$scope.leafReq += "0,";
		}		

		if ($scope.leaf.spots)
		{
			$scope.leafReq += "1,";
		}
		if (!$scope.leaf.spots)
		{
			$scope.leafReq += "0,";
		}			
		
		if ($scope.leaf.defoliated)
		{
			$scope.leafReq += "1,";
		}
		if (!$scope.leaf.defoliated)
		{
			$scope.leafReq += "0,";
		}		

		if ($scope.leaf.plantMold)
		{
			$scope.leafReq += "1,";
		}
		if (!$scope.leaf.plantMold)
		{
			$scope.leafReq += "0,";
		}	

		if ($scope.leaf.distorted)
		{
			$scope.leafReq += "1";
		}
		if (!$scope.leaf.distorted)
		{
			$scope.leafReq += "0";
		}			
	}
	
	var fruitData = function()
	{
		if ($scope.fruit.discolored)
		{
			$scope.fruitReq += "1,";
		}
		if (!$scope.fruit.discolored)
		{
			$scope.fruitReq += "0,";
		}
			
		if ($scope.fruit.holes)
		{
			$scope.fruitReq += "1,";
		}
		if (!$scope.fruit.holes)
		{
			$scope.fruitReq += "0,";
		}		

		if ($scope.fruit.spots)
		{
			$scope.fruitReq += "1,";
		}
		if (!$scope.fruit.spots)
		{
			$scope.fruitReq += "0,";
		}			
		
		if ($scope.fruit.defoliated)
		{
			$scope.fruitReq += "1,";
		}
		if (!$scope.fruit.defoliated)
		{
			$scope.fruitReq += "0,";
		}		

		if ($scope.fruit.galls)
		{
			$scope.fruitReq += "1,";
		}
		if (!$scope.fruit.galls)
		{
			$scope.fruitReq += "0,";
		}	

		if ($scope.fruit.mold)
		{
			$scope.fruitReq += "1";
		}
		if (!$scope.fruit.mold)
		{
			$scope.fruitReq += "0";
		}			
	}
	
	var branchesData = function()
	{
		if ($scope.branches.discolored)
		{
			$scope.branchesReq += "1,";
		}
		if (!$scope.branches.discolored)
		{
			$scope.branchesReq += "0,";
		}
			
		if ($scope.branches.holes)
		{
			$scope.branchesReq += "1,";
		}
		if (!$scope.branches.holes)
		{
			$scope.branchesReq += "0,";
		}		

		if ($scope.branches.spots)
		{
			$scope.branchesReq += "1,";
		}
		if (!$scope.branches.spots)
		{
			$scope.branchesReq += "0,";
		}			
		
		if ($scope.branches.sap)
		{
			$scope.branchesReq += "1,";
		}
		if (!$scope.branches.sap)
		{
			$scope.branchesReq += "0,";
		}		

		if ($scope.branches.galls)
		{
			$scope.branchesReq += "1,";
		}
		if (!$scope.branches.galls)
		{
			$scope.branchesReq += "0,";
		}	

		if ($scope.branches.mold)
		{
			$scope.branchesReq += "1";
		}
		if (!$scope.branches.mold)
		{
			$scope.branchesReq += "0";
		}			
	}
	
	var overallData = function()
	{
		if ($scope.plant.wilt)
		{
			$scope.plantReq += "1,";
		}
		if (!$scope.plant.wilt)
		{
			$scope.plantReq += "0,";
		}
			
		if ($scope.plant.dieback)
		{
			$scope.plantReq += "1,";
		}
		if (!$scope.plant.dieback)
		{
			$scope.plantReq += "0,";
		}		

		if ($scope.plant.stunted)
		{
			$scope.plantReq += "1,";
		}
		if (!$scope.plant.stunted)
		{
			$scope.plantReq += "0,";
		}			
		
		if ($scope.plant.dead)
		{
			$scope.plantReq += "1,";
		}
		if (!$scope.plant.dead)
		{
			$scope.plantReq += "0,";
		}		

		if ($scope.plant.healthy)
		{
			$scope.plantReq += "1,";
		}
		if (!$scope.plant.healthy)
		{
			$scope.plantReq += "0,";
		}	

		if ($scope.plant.distorted)
		{
			$scope.plantReq += "1,";
		}
		if (!$scope.plant.distorted)
		{
			$scope.plantReq += "0,";
		}		

		if ($scope.plant.multi)
		{
			$scope.plantReq += "1";
		}
		if (!$scope.plant.multi)
		{
			$scope.plantReq += "0";
		}		
	}
	
	var bugData = function()
	{
		if ($scope.bugs.borer)
		{
			$scope.bugsReq += "1,";
		}
		if (!$scope.bugs.borer)
		{
			$scope.bugsReq += "0,";
		}
			
		if ($scope.bugs.caterpillar)
		{
			$scope.bugsReq += "1,";
		}
		if (!$scope.bugs.caterpillar)
		{
			$scope.bugsReq += "0,";
		}		

		if ($scope.bugs.moths)
		{
			$scope.bugsReq += "1,";
		}
		if (!$scope.bugs.moths)
		{
			$scope.bugsReq += "0,";
		}			
		
		if ($scope.bugs.leafFeeder)
		{
			$scope.bugsReq += "1";
		}
		if (!$scope.bugs.leafFeeder)
		{
			$scope.bugsReq += "0";
		}		
	}
});
