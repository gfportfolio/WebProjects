﻿var assert = require("assert");

require("../BASE.js");
BASE.require.loader.setRoot("./");

BASE.require([
    "BASE.data.testing.Edm",
    "BASE.data.services.InMemoryService",
    "BASE.data.DataContext"
], function () {
    
    var Edm = BASE.data.testing.Edm;
    var Service = BASE.data.services.InMemoryService;
    var DataContext = BASE.data.DataContext;
    var Future = BASE.async.Future;
    
    var fillWithData = function (service) {
        var dataContext = new DataContext(service);
        
        var person = dataContext.people.createInstance();
        person.firstName = "Jared";
        person.lastName = "Barnes";
        
        var address = dataContext.addresses.createInstance();
        address.street1 = "3846 West 625 North";
        address.city = "Cedar City";
        address.state = "Utah";
        address.country = "USA";
        address.zip = "84721";
        
        var address1 = dataContext.addresses.createInstance();
        address1.street1 = "?";
        address1.city = "Cedar City";
        address1.state = "Utah";
        address1.country = "USA";
        address1.zip = "84720";
        
        var phoneNumber = dataContext.phoneNumbers.createInstance();
        phoneNumber.areacode = "435";
        phoneNumber.lineNumber = "5908500";
        
        var phoneNumber1 = dataContext.phoneNumbers.createInstance();
        phoneNumber1.areacode = "435";
        phoneNumber1.lineNumber = "5921384";
        
        var hrAccount = dataContext.hrAccounts.createInstance();
        hrAccount.accountId = "12345";
        
        person.hrAccount = hrAccount;
        person.phoneNumbers.push(phoneNumber);
        person.phoneNumbers.push(phoneNumber1);
        
        person.addresses.push(address);
        person.addresses.push(address1);
        
        var person2 = dataContext.people.createInstance();
        person2.firstName = "LeAnn";
        person2.lastName = "Barnes";
        
        address = dataContext.addresses.createInstance();
        address.street1 = "3846 West 625 North";
        address.city = "Cedar City";
        address.state = "Utah";
        address.country = "USA";
        address.zip = "84721";
        
        address1 = dataContext.addresses.createInstance();
        address1.street1 = "?";
        address1.city = "Cedar City";
        address1.state = "Utah";
        address1.country = "USA";
        address1.zip = "84720";
        
        phoneNumber = dataContext.phoneNumbers.createInstance();
        phoneNumber.areacode = "435";
        phoneNumber.lineNumber = "5908500";
        
        phoneNumber1 = dataContext.phoneNumbers.createInstance();
        phoneNumber1.areacode = "435";
        phoneNumber1.lineNumber = "5921384";
        
        hrAccount = dataContext.hrAccounts.createInstance();
        hrAccount.accountId = "12346";
        
        person2.hrAccount = hrAccount;
        person2.phoneNumbers.push(phoneNumber);
        person2.phoneNumbers.push(phoneNumber1);
        
        person2.addresses.push(address);
        person2.addresses.push(address1);
        
        var permission = dataContext.permissions.createInstance();
        permission.people.add(person, person2);
        
        return dataContext.saveChangesAsync();
    };
    
    exports["BASE.data.DataContext: Get count and make sure nothing is loaded."] = function () {
        var service = new Service(new Edm());
        var dataContext = new DataContext(service);
        
        fillWithData(service).then(function () {
            
            dataContext.asQueryable(BASE.data.testing.Person).count().then(function (count) {
                assert.equal(count, 2);
                
                dataContext.asQueryableLocal(BASE.data.testing.Person).count().then(function (count) {
                    assert.equal(count, 0);
                });
            });
        });

    };
    
    exports["BASE.data.DataContext: Query from set."] = function () {
        var service = new Service(new Edm());
        var dataContext = new DataContext(service);
        
        fillWithData(service).then(function () {
            dataContext.people.where(function (e) {
                return e.property("firstName").isEqualTo("Jared");
            }).toArray().then(function (results) {
                assert.equal(results.length, 1);
                assert.equal(results[0].firstName, "Jared");
            });
        });

    };
    
    exports["BASE.data.DataContext: Add an entity, with a one to one relationship."] = function () {
        var service = new Service(new Edm());
        var dataContext = new DataContext(service);
        
        var person = dataContext.people.createInstance();
        person.firstName = "John";
        person.lastName = "Doe";
        
        var hrAccount = dataContext.hrAccounts.createInstance();
        
        hrAccount.person = person;
        hrAccount.accountId = 1;
        
        assert.equal(dataContext.getPendingEntities().added.length, 2);
        
        dataContext.saveChangesAsync().then(function (response) {
            var p = person;
            assert.equal(dataContext.getPendingEntities().added.length, 0);
            
            service.asQueryable(BASE.data.testing.Person).toArray(function (results) {
                assert.equal(results[0].firstName, "John");
            });
            
            service.asQueryable(BASE.data.testing.HrAccount).toArray(function (results) {
                assert.equal(results[0].accountId, 1);
            });

        }).ifError(function () {
            assert.fail("Data Context failed to save.");
        });
    };
    
    
    exports["BASE.data.DataContext: Update an entity."] = function () {
        var service = new Service(new Edm());
        fillWithData(service).then(function () {
            var dataContext = new DataContext(service);
            
            dataContext.people.where(function (e) {
                return e.property("firstName").isEqualTo("LeAnn");
            }).firstOrDefault().then(function (person) {
                person.firstName = "Jaelyn";
                
                var hrAccount = dataContext.hrAccounts.createInstance();
                hrAccount.accountId = "555555";
                
                person.hrAccount = hrAccount;
                
                var phoneNumber = dataContext.phoneNumbers.createInstance();
                phoneNumber.areacode = "435";
                phoneNumber.lineNumber = "5555555";
                
                phoneNumber.person = person;
                
                var permission = dataContext.permissions.createInstance();
                permission.name = "Admin";
                
                person.permissions.push(permission);
                
                dataContext.saveChangesAsync().then(function (response) {
                    dataContext.people.where(function (e) {
                        return e.property("firstName").isEqualTo("LeAnn");
                    }).count().then(function (count) {
                        assert.equal(count, 0);
                    });
                    
                    person.phoneNumbers.asQueryable().toArray().then(function (phoneNumbers) {
                        assert.equal(phoneNumbers.length, 3);
                        
                        var has55555555 = phoneNumbers.some(function (phoneNumber) {
                            return phoneNumber.lineNumber === "5555555"
                        });
                        
                        assert.equal(has55555555, true);

                    });
                    
                    service.asQueryable(BASE.data.testing.Permission).where(function (e) {
                        return e.property("name").isEqualTo("Admin");
                    }).count().then(function (count) {
                        assert.equal(count, 1);
                    });

                }).ifError(function (response) {
                    
                });

            });

        });

    };
    
    exports["BASE.data.DataContext: Remove existing many to many."] = function () {
        var service = new Service(new Edm());
        fillWithData(service).then(function () {
            var dataContext = new DataContext(service);
            
            dataContext.people.toArray().then(function (people) {
                Future.all(people.map(function (person) {
                    return person.permissions.asQueryable().toArray();
                })).chain(function (permissions) {

                    people.forEach(function (person) { 
                        person.permissions.pop();
                    });

                    return dataContext.saveChangesAsync();

                }).then(function () { 
                });
            });
        });
    };
    
    exports["BASE.data.DataContext: Remove an entity."] = function () {
        var service = new Service(new Edm());
        fillWithData(service).then(function () {
            var dataContext = new DataContext(service);
            
            dataContext.people.toArray().then(function (people) {
                people.forEach(function (person) {
                    dataContext.people.remove(person);
                });
                
                dataContext.saveChangesAsync().then(function () {
                    service.asQueryable(BASE.data.testing.Person).count().then(function (count) {
                        assert.equal(count, 0);
                    });
                });
            });
        });
    };
    
    exports["BASE.data.DataContext: Add many to many on source."] = function () {
        var service = new Service(new Edm());
        var dataContext = new DataContext(service);
        
        var person = dataContext.people.createInstance();
        person.firstName = "Jared";
        person.lastName = "Barnes";
        
        var permission = dataContext.permissions.createInstance();
        
        permission.name = "Admin";
        person.permissions.add(permission);
        
        dataContext.saveChangesAsync().then(function () {
            assert.equal(typeof person.id !== "undefined", true);
            assert.equal(typeof permission.id !== "undefined", true);
        });
    };
});
