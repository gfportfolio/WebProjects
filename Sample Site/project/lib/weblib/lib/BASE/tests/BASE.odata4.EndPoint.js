﻿var assert = require("assert");

require("../BASE.js");
BASE.require.loader.setRoot("./");

BASE.require([
    "BASE.odata4.EndPoint",
    "BASE.web.MockAjaxProvider",
    "BASE.odata4.OData4DataConverter",
    "BASE.query.Provider",
    "BASE.data.testing.Person",
    "BASE.data.testing.model.person",
    "BASE.data.testing.Edm"
], function () {
    
    var EndPoint = BASE.odata4.EndPoint;
    var MockAjaxProvider = BASE.web.MockAjaxProvider;
    var Provider = BASE.query.Provider;
    var OData4DataConverter = BASE.odata4.OData4DataConverter;
    var dataConverter = new OData4DataConverter();
    var Person = BASE.data.testing.Person;
    var Edm = BASE.data.testing.Edm;
    var edm = new Edm();
    
    var person = new Person();
    person.id = 1;
    person.firstName = "Jared";
    person.lastName = "Barnes";
    person.badProperty = "BAD;";
    
    var personModel = BASE.data.testing.model.person;
    
    var isMatch = function (message) {
        return function (error) {
            return message === error.message;
        };
    };
    
    exports["BASE.odata4.EndPoint: null argument test url"] = function () {
        assert.throws(function () {
            new EndPoint();
            
        }, isMatch("EndPoint: Null Argument Exception - url needs to be a string."));
    };
    
    exports["BASE.odata4.EndPoint: null argument test url"] = function () {
        assert.throws(function () {
            new EndPoint({
                url: ""
            });
            
        }, isMatch("EndPoint: Null Argument Exception - model needs to be supplied."));
    };
    
    exports["BASE.odata4.EndPoint: null argument test queryProvider"] = function () {
        assert.throws(function () {
            new EndPoint({
                url: "",
                model: personModel
            });

        }, isMatch("EndPoint: Null Argument Exception - queryProvider cannot be undefined."));
    };
    
    exports["BASE.odata4.EndPoint: null argument test ajaxProvider"] = function () {
        assert.throws(function () {
            new EndPoint({
                url: "",
                model: personModel,
                queryProvider: new Provider()
            });
            
        }, isMatch("EndPoint: Null Argument Exception - ajaxProvider cannot be undefined."));
    };
    
    exports["BASE.odata4.EndPoint: invokeInstanceFunction without arguments."] = function () {
        var ajaxProvider = new MockAjaxProvider({
            dataConverter: dataConverter
        });
        var config = {
            ajaxProvider: ajaxProvider,
            url: "https://api.leavitt.com/People",
            model: personModel,
            queryProvider: new Provider(),
            edm: edm
        };
        
        ajaxProvider.addResponseHandlerByPath("https://api.leavitt.com/People(1)/FullName", function () {
            
            var response = "Jared Barnes";
            
            var json = JSON.stringify(response);
            
            return {
                response: json,
                responseText: json,
                responseType: "text",
                status: 200,
                statusText: "200 OK"
            };
        });
        
        var endPoint = new EndPoint(config);
        
        // (key, methodName, argumentsObject);
        var future = endPoint.invokeInstanceFunction(1, "FullName");
        
        future.then(function (result) {
            assert.equal(result, "Jared Barnes");
        }).ifError(function (error) {
            assert.fail("Unexpected error with invokeInstanceMethod \"Fullname\".");
        });
    };
    
    exports["BASE.odata4.EndPoint: invokeInstanceFunction with arguments."] = function () {
        var ajaxProvider = new MockAjaxProvider({
            dataConverter: dataConverter
        });
        var config = {
            ajaxProvider: ajaxProvider,
            url: "https://api.leavitt.com/People",
            model: personModel,
            queryProvider: new Provider(),
            edm: edm
        };
        
        ajaxProvider.addResponseHandlerByPath("https://api.leavitt.com/People(1)/isEqualTo(FirstName='Jared')", function () {
            
            var response = true;
            var json = JSON.stringify(response);
            
            return {
                response: json,
                responseText: json,
                responseType: "text",
                status: 200,
                statusText: "200 OK"
            };
        });
        
        var endPoint = new EndPoint(config);
        
        // (key, methodName, argumentsObject);
        var future = endPoint.invokeInstanceFunction(1, "isEqualTo", { FirstName: "Jared" });
        
        future.then(function (result) {
            assert.equal(result, true);
        }).ifError(function (error) {
            assert.fail("Unexpected error with invokeInstanceMethod \"isEqualTo\".");
        });
    };
    
    exports['BASE.odata4.EndPoint: invokeClassFunction.'] = function () {
        var ajaxProvider = new MockAjaxProvider({
            dataConverter: dataConverter
        });
        
        var config = {
            ajaxProvider: ajaxProvider,
            url: 'https://api.leavitt.com/People', 
            model: personModel,
            queryProvider: new Provider(),
            edm: edm
        };
        
        ajaxProvider.addResponseHandlerByPath('https://api.leavitt.com/People/Search(Name=\'Jared\')', function () {
            
            var response = [{
                    FirstName: 'Jared',
                    LastName: 'Barnes'
                }, {
                    FirstName: 'Jared',
                    LastName: 'Rucker'
                }];
            
            var json = JSON.stringify(response);
            
            return {
                response: json,
                responseText: json,
                responseType: 'text',
                status: 200,
                statusText: '200 OK'
            };
        });
        
        var endPoint = new EndPoint(config);
        
        var future = endPoint.invokeClassFunction('Search', { Name: 'Jared' });
        
        future.then(function (results) {
            assert.equal(results.length, 2);
            assert.equal(results[0].firstName, 'Jared');
            assert.equal(results[0].lastName, 'Barnes');
        }).ifError(function () {
            assert.fail('Unexpected error with invokeClassMethod "Search".');
        });
    };
    
    exports["BASE.odata4.EndPoint: add entity."] = function () {
        var ajaxProvider = new MockAjaxProvider({
            dataConverter: dataConverter
        });
        
        var config = {
            ajaxProvider: ajaxProvider,
            url: "https://api.leavitt.com/People",
            model: personModel,
            queryProvider: new Provider(),
            edm: edm
        };
        
        ajaxProvider.addResponseHandlerByPath("https://api.leavitt.com/People", function (options) {
            
            var response = {
                id: 1,
                FirstName: "Jared",
                LastName: "Barnes"
            };
            
            var json = JSON.stringify(response);
            
            return {
                response: json,
                responseText: json,
                responseType: "text",
                status: 201,
                statusText: "Created"
            };
        });
        
        var endPoint = new EndPoint(config);
        
        var future = endPoint.add(person);
        
        future.then(function (result) {
            assert.equal(result.firstName, "Jared");
            assert.equal(result.lastName, "Barnes");
            assert.equal(result.id, 1);
        }).ifError(function (error) {
            assert.fail("Unexpected error with adding an entity.");
        });
    };
    
    exports["BASE.odata4.EndPoint: add null entity."] = function () {
        var ajaxProvider = new MockAjaxProvider({
            dataConverter: dataConverter
        });
        
        var config = {
            ajaxProvider: ajaxProvider,
            url: "https://api.leavitt.com/People",
            model: personModel,
            queryProvider: new Provider(),
            edm: edm
        };
        
        assert.throws(function () {
            var endPoint = new EndPoint(config);
            endPoint.add(null).try();
        }, isMatch("The parameter entity cannot be null or undefined."));
       
    };
    
    exports["BASE.odata4.EndPoint: add entity bad request."] = function () {
        var ajaxProvider = new MockAjaxProvider({
            dataConverter: dataConverter
        });
        
        var config = {
            ajaxProvider: ajaxProvider,
            url: "https://api.leavitt.com/People",
            model: personModel,
            queryProvider: new Provider(),
            edm: edm
        };
        
        ajaxProvider.addResponseHandlerByPath("https://api.leavitt.com/People", function (options) {
            
            var response = {
                error: {
                    message: "Bad Request"
                }
            };
            
            var json = JSON.stringify(response);
            
            return {
                response: json,
                responseText: json,
                responseType: "text",
                status: 400,
                statusText: "Bad Request"
            };
        });
        
        var endPoint = new EndPoint(config);
        
        var future = endPoint.add(person);
        
        future.then(function (result) {
            assert.fail();
        }).ifError(function (error) {
            assert.equal(error.message, "Bad Request");
        });
    };
    
    exports["BASE.odata4.EndPoint: update entity."] = function () {
        var ajaxProvider = new MockAjaxProvider({
            dataConverter: dataConverter
        });
        
        var config = {
            ajaxProvider: ajaxProvider,
            url: "https://api.leavitt.com/People",
            model: personModel,
            queryProvider: new Provider(),
            edm: edm
        };
        
        ajaxProvider.addResponseHandlerByPath("https://api.leavitt.com/People(1)", function (options) {
            var response = {
                id: 1,
                FirstName: "Jared",
                LastName: "Barney"
            };
            
            var json = JSON.stringify(response);
            
            return {
                response: json,
                responseText: json,
                responseType: "text",
                status: 202,
                statusText: "202"
            };
        });
        
        var endPoint = new EndPoint(config);
        
        var future = endPoint.update(person, {
            lastName: "Barney"
        });
        
        future.then(function (result) {
            assert.equal(result.firstName, "Jared");
            assert.equal(result.lastName, "Barney");
            assert.equal(result.id, 1);
        }).ifError(function (error) {
            assert.fail("Unexpected error with adding an entity.");
        });
    };
    
    exports["BASE.odata4.EndPoint: update null entity."] = function () {
        var ajaxProvider = new MockAjaxProvider({
            dataConverter: dataConverter
        });
        
        var config = {
            ajaxProvider: ajaxProvider,
            url: "https://api.leavitt.com/People",
            model: personModel,
            queryProvider: new Provider(),
            edm: edm
        };
        
        assert.throws(function () {
            var endPoint = new EndPoint(config);
            endPoint.update(null, {}).try();
        }, isMatch("The parameter entity cannot be null or undefined."));
       
    };
    
    exports["BASE.odata4.EndPoint: update entity with an empty object."] = function () {
        var ajaxProvider = new MockAjaxProvider({
            dataConverter: dataConverter
        });
        
        var config = {
            ajaxProvider: ajaxProvider,
            url: "https://api.leavitt.com/People",
            model: personModel,
            queryProvider: new Provider(),
            edm: edm
        };
        
        assert.throws(function () {
            var endPoint = new EndPoint(config);
            endPoint.update({
                id: 1,
                firstName: "Jared",
                lastName: "Barnes"
            }, {}).try();
        }, isMatch("Need to have at least one property to update."));
       
    };
    
    exports["BASE.odata4.EndPoint: update entity bad request."] = function () {
        var ajaxProvider = new MockAjaxProvider({
            dataConverter: dataConverter
        });
        
        var config = {
            ajaxProvider: ajaxProvider,
            url: "https://api.leavitt.com/People",
            model: personModel,
            queryProvider: new Provider(),
            edm: edm
        };
        
        ajaxProvider.addResponseHandlerByPath("https://api.leavitt.com/People(1)", function (options) {
            
            var response = {
                error: {
                    message: "Bad Request"
                }
            };
            
            var json = JSON.stringify(response);
            
            return {
                response: json,
                responseText: json,
                responseType: "text",
                status: 400,
                statusText: "Bad Request"
            };
        });
        
        var endPoint = new EndPoint(config);
        
        var future = endPoint.update(person, {
            badProperty: "BAD"
        });
        
        future.then(function (result) {
            assert.fail();
        }).ifError(function (error) {
            assert.equal(error.message, "Bad Request");
        });
    };
    
    exports["BASE.odata4.EndPoint: remove entity."] = function () {
        var ajaxProvider = new MockAjaxProvider({
            dataConverter: dataConverter
        });
        
        var config = {
            ajaxProvider: ajaxProvider,
            url: "https://api.leavitt.com/People",
            model: personModel,
            queryProvider: new Provider(),
            edm: edm
        };
        
        ajaxProvider.addResponseHandlerByPath("https://api.leavitt.com/People(1)", function (options) {
            return {
                response: "",
                responseText: "",
                responseType: "text",
                status: 204,
                statusText: "No Content"
            };
        });
        
        var endPoint = new EndPoint(config);
        
        var future = endPoint.remove(person);
        
        future.then(function (result) {
            assert.equal(result, undefined);
        }).ifError(function (error) {
            assert.fail("Unexpected error with adding an entity.");
        });
    };
    
    exports["BASE.odata4.EndPoint: remove entity bad request."] = function () {
        var ajaxProvider = new MockAjaxProvider({
            dataConverter: dataConverter
        });
        
        var config = {
            ajaxProvider: ajaxProvider,
            url: "https://api.leavitt.com/People",
            model: personModel,
            queryProvider: new Provider(),
            edm: edm
        };
        
        ajaxProvider.addResponseHandlerByPath("https://api.leavitt.com/People(1)", function (options) {
            
            var response = {
                error: {
                    message: "Bad Request"
                }
            };
            
            var json = JSON.stringify(response);
            
            return {
                response: json,
                responseText: json,
                responseType: "text",
                status: 400,
                statusText: "Bad Request"
            };
        });
        
        var endPoint = new EndPoint(config);
        
        var future = endPoint.remove(person);
        
        future.then(function (result) {
            assert.fail();
        }).ifError(function (error) {
            assert.equal(error.message, "Bad Request");
        });
    };

});