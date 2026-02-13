I have some difference in documentation. 
And i want to have single source of truth and not different documents. 

Main things: 
We are building app for wine restaurant  which is using syrve. 
Data in syrve is a source of truth. We are building generic app not wine specific app, but we will use wine restaurant as first client.  so we need to have additional fields and tables to store additional information for wine restaurant.  But main goal is to make inventorisation easy with ai ocr recognition. 

Platform default roles: Super_admin, Manager, Staff. Auth will be via Login and password. not by email
Super_admin: is me, I can manage and view everything but no other roles can view me. 

Manager: Main admin/role for restaurant, can setup app, connect to Syrve, manage all different logic regarding calculation, stock level, manage staff , manage roles, create new and etc, manage permitions for roles, view all details, setings, and etc of the platform, can start Inventorisaiton, confirm inventarisation results, and send them to surve, manage all business details, setup glasses, link glasses to categories of drinks, view reports, view logs inventorisation, of all users,so configure whole app. 
Admin login to the system and setup integration with Syrve as a first step. First testing that connection is correct. Than selecting proper profile for restaurant. 
Next step is to start integration with syrve and receiving data from syrve by steps. Import main data, busines details, Categories, inventory, all other main information.
Main roles: Super_admin is I, I can manage and view everything but no other roles can view me. 
Manager: Main role for restaurant, can setup app, connect to Syrve, manage all different logic regarding calculation, stock level, manage staff , manage roles, create new and etc, manage permitions for roles, view all details, setings, and etc of the platform, can start Inventorisaiton, confirm inventarisation results, and send them to surve, manage all business details, setup glasses, link glasses to categories of drinks, view reports, view logs inventorisation, of all users,so configure whole app. 

we will use Server API only
From my app no possibility right now add new item, create group, and etc. Syrve source of truth. 
For Product we can have basic information from Syrve and have much more details, like Image, additional enrichment of product details, keep history of changing and inventorisaiton history, and etc. Also we can mark wine which is selling by glasses, 
Inventoriasation: is the main feature right now. user click start inventorisation, latest inventory with stock amount loaded, with additional details and columns.And inventorisation session started. Users can view the whole list of available products. and start inventorisaiton by using camera on mobile with ai recognition of the bottle label/or searching manually then user can enter amount of bottles and also add amount in open bottle in ml's. when they click add, this is stored in inventorisation table in bottles and in liters. One logic additional as there is no fixed location when wine can be located, each user can add items at the same time, it should be stored properly and calculated. so it will not rewrite another user entry. Better maybe to have for period of inventorisation that each user have something like virtual table which after finishing inventorisation will be calculated and added to main inventorisation. Only manager can view current stock amount, user will not have this possibility. Manager can review difference, make changes if needed, confirm inventorisation session, and session will be closed, all needed documents will be created and will be ready to send to syrve. also all this documents and logs will be stored in app. . and when manager click send to syrve button, this action will   send all to syrve.

