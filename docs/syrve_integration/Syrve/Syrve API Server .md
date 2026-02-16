# Authorization

|  ![Warning][image1] When you log in, you take one API Server license. The authorization token can be used until the moment when it ceases to be valid. If you have one server license, you can only get one token. If your token is not in the public domain, then you need to log out in order not to take a server license.  |
| :---- |

## Authorization

| Request  | http://host:port/resto/api/auth?login=\[login\]\&pass=\[sha1passwordhash\]\]  |
| :---- | :---- |
| login | This is login for account user Syrve Office |
| pass | This is the password for the Syrve Office user account in SHA1 format. You should get like this: printf "passwordOffice" | sha1sum |
| Response | Token to be passed as a parameter named “key” in API requests |
| Example | http://localhost:8080/resto/api/auth?login=admin\&pass=2155245b2c002a1986d3f384af93be813537a476  |

## Logout

| Request  | http://host:port/resto/api/logout?key=\[token\]  |
| :---- | :---- |
| key | This is the token received during authorization |
| Example | http://localhost:8080/resto/api/logout?key=b354d18c-3d3a-e1a6-c3b9-9ef7b5055318  |

# 

# Items

## Product list

| HTTP Method  | GET |
| :---- | :---- |
| URI | /products/  |
| Result | All active products by type. Supplier's goods included |
| Description |  **Item type** Code Name Code GOODS  This is ingredients DISH  This is an item PREPARED This is prepared SERVICE  This is service MODIFIER This is modifier OUTER  This is outer goods PETROL  This is petrol  RATE  This is rate  **Group product type** Code Name Code Comments PRODUCTS  This is products MODIFIERS Modifiers Not used  |

## 

### Parameters 

| Name Parameter | Value | Description |
| :---- | :---- | :---- |
| includeDeleted | true/false  | Include deleted items in the result. The default setting is false   |

#### Request example

| [http://localhost:8080/resto/api/products?key=754a4184-a626-d2eb-c7a9-94d8244b5ca7](http://localhost:8080/resto/api/products?key=754a4184-a626-d2eb-c7a9-94d8244b5ca7) |
| :---- |

## Product Search

| HTTP Method  | GET |
| :---- | :---- |
| URI | /products/search  |
| Result  | *ProductDto,* if there is a product with the specified parameters. (XSD Product) |

### Parameters 

| Name Parameter | Value | Description |
| :---- | :---- | :---- |
| includeDeleted  | true/false  | Include deleted items in the result. The default setting is false   |
| name  | {regexp} \- regular expression | This is name products |
| code  | {regexp} \- regular expression | This is the speed dial code for the front |
| mainUnit  | {regexp} \- regular expression | This is measure units |
| num  | {regexp} \- regular expression | This is  SKU |
| cookingPlaceType | {regexp} \- regular expression | This is cooking place type |
| productGroupType  | {regexp} \- regular expression | This is product group type |
| productType  | {regexp} \- regular expression | This is product type |

#### Request example

| [http://localhost:8080/resto/api/products/search?key=754a4184-a626-d2eb-c7a9-94d8244b5ca7\&productGroupType=P](http://localhost:8080/resto/api/products/search?key=754a4184-a626-d2eb-c7a9-94d8244b5ca7&productGroupType=P) |
| :---- |

## Peculiar properties

All active products by type are transferred to search and upload. Supplier's goods included. All Supplier's products that are in the system will be unloaded.

##### XSD

## 

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" version="1.0"\>    \<xs:element name="productDtoes"\>        \<xs:complexType\>            \<xs:sequence\>                \<xs:element name="productDto" type="productDto" minOccurs="0" maxOccurs="unbounded"/\>            \</xs:sequence\>        \</xs:complexType\>    \</xs:element\>    \<xs:complexType name="productDto"\>        \<xs:sequence\>            \<\!-- Product ID (guid)  \--\>            \<xs:element name="id" type="xs:string" minOccurs="0"/\>            \<\!-- Parent Group  \--\>            \<xs:element name="parentId" type="xs:string" minOccurs="0"/\>            \<\!-- SKU  \--\>            \<xs:element name="num" type="xs:string" minOccurs="0"/\>            \<\!-- The speed dial code for the front \--\>            \<xs:element name="code" type="xs:string" minOccurs="0"/\>            \<\!-- Name products  \--\>            \<xs:element name="name" type="xs:string"/\>            \<\!-- Item type \--\>            \<xs:element name="productType" type="productType\_enum" minOccurs="0"/\>            \<\!-- Product group type \--\>            \<xs:element name="productGroupType" type="productGroupType\_enum" minOccurs="0"/\>            \<\!-- Сooking place type \--\>            \<xs:element name="cookingPlaceType" type="xs:string" minOccurs="0"/\>            \<\!-- Measure Units  \--\>            \<xs:element name="mainUnit" type="xs:string" minOccurs="0"/\>            \<\!-- Products category \--\>            \<xs:element name="productCategory" type="xs:string" minOccurs="0"/\>            \<\!-- Packing unit \--\>            \<xs:element name="containers" minOccurs="0"\>                \<xs:complexType\>                    \<xs:sequence\>                        \<xs:element name="container" type="containerDto" minOccurs="0" maxOccurs="unbounded"/\>                    \</xs:sequence\>                \</xs:complexType\>            \</xs:element\>            \<\!-- Barcode \--\>            \<xs:element name="barcodes" minOccurs="0"\>                \<xs:complexType\>                    \<xs:sequence\>                        \<xs:element name="barcodeContainer" type="barcodeContainerDto" minOccurs="0" maxOccurs="unbounded"/\>                    \</xs:sequence\>                \</xs:complexType\>            \</xs:element\>        \</xs:sequence\>    \</xs:complexType\>    \<xs:complexType name="containerDto"\>        \<xs:sequence\>            \<xs:element name="id" type="xs:string" minOccurs="0"/\>            \<xs:element name="num" type="xs:string" minOccurs="0"/\>            \<xs:element name="name" type="xs:string"/\>            \<xs:element name="count" type="xs:decimal" minOccurs="0"/\>            \<xs:element name="minContainerWeight" type="xs:decimal" minOccurs="0"/\>            \<xs:element name="maxContainerWeight" type="xs:decimal" minOccurs="0"/\>            \<xs:element name="containerWeight" type="xs:decimal" minOccurs="0"/\>            \<xs:element name="fullContainerWeight" type="xs:decimal" minOccurs="0"/\>            \<xs:element name="density" type="xs:decimal" minOccurs="0"/\>            \<xs:element name="backwardRecalculation" type="xs:boolean" minOccurs="0"/\>            \<xs:element name="deleted" type="xs:boolean"/\>            \<xs:element name="useInFront" type="xs:boolean" minOccurs="0"/\>        \</xs:sequence\>    \</xs:complexType\>    \<xs:complexType name="barcodeContainerDto"\>        \<xs:sequence\>            \<xs:element name="barcode" type="xs:string"/\>            \<xs:element name="containerName" type="xs:string" minOccurs="0"/\>        \</xs:sequence\>    \</xs:complexType\>    \<xs:simpleType name="productType\_enum"\>        \<xs:restriction base="xs:string"\>            \<xs:enumeration value="GOODS"/\>            \<xs:enumeration value="DISH"/\>            \<xs:enumeration value="PREPARED"/\>            \<xs:enumeration value="SERVICE"/\>            \<xs:enumeration value="MODIFIER"/\>            \<xs:enumeration value="OUTER"/\>            \<xs:enumeration value="PETROL"/\>            \<xs:enumeration value="RATE"/\>        \</xs:restriction\>    \</xs:simpleType\>    \<xs:simpleType name="productGroupType\_enum"\>        \<xs:restriction base="xs:string"\>            \<xs:enumeration value="PRODUCTS"/\>            \<xs:enumeration value="MODIFIERS"/\>        \</xs:restriction\>    \</xs:simpleType\> \</xs:schema\>  |

## 

## Item elements

### Get Items

| HTTP Method  | GET  |
| :---- | :---- |
| URI | entities/products/list?includeDeleted={includeDeleted}  |
| Result  | Result is the list of Items |

#### 

#### Parameters

| Name Parameter | Type | Description |
| :---- | :---- | :---- |
| includeDeleted  | Boolean  | Include deleted items in the result. The default setting is |
| ids  | List\<UUID\>  | Item which have returned, they must have id from this list |
| nums  | List\<String\>  | Item which have returned, they must have SKU from this list |
| types | List\<ProductType\> | Item which have returned, they must have type from this list |
| categoryIds  | List\<UUID\>  | Item which have returned, they must have category id from this list |
| parentIds  | List\<UUID\>  | Item elements which have returned, they must have parent group id from this list |

#### 

#### Result 

ProductDto list

| Name Parameter | Type | Description  |
| :---- | :---- | :---- |
| id  | UUID  | This is UUID Item element |
| deleted  | Boolean  | Value is true, if the product is deleted |
| name | String  | This is name product |
| description  | String  | This is description product |
| num  | String  | This is SKU product |
| code | String  | This is the speed dial code for the front |
| parent  | UUID  | This is UUID parent group product |
| modifiers  | List\<ChoiceBindingDto\> |   Name Parameter Type Description  modifier  UUID  his is modifier UUID or UUID Item group, if this is group modifier. defaultAmount Integer  This is the default amount freeOfChargeAmount  Integer  This is amount of free modifiers  minimumAmount  Integer  This is minimum amount modifiers maximumAmount  Integer  This is maximum amount modifiers hideIfDefaultAmount  Boolean  Hide if amount is default required  Boolean  Value is true, if modifier is required childModifiersHaveMinMaxRestrictions  Boolean  Min. Max. amount of child modifiers. splittable Boolean  Sign of divisibility of the modifier. Used only in modifier schemes childModifiers  List\<ChoiceBindingDto\> This is children modifiers  |
| taxCategory  | UUID  | This is UUID tax category |
| category | UUID  | This is custom category |
| accountingCategory  | UUID  | This is accounting category |
| color  | RGBColorDto  | This is button color in Syrve POS Name Parameter Type Description  red  Integer  This is value for red color green  Integer  This is value for green color blue  Integer  This is value for blue color  |
| fontColor  | RGBColorDto  | This is font color in Syrve POS |
| frontImageId  | UUID  | This is UUID product image for Syrve POS  |
| position  | Integer  | This is position in menu   |
| mainUnit  | UUID  | This is UUID main unit product |
| excludedSections  | Set\<UUID\>  | Multiple UUIDs of restaurant branches that cannot sell this product |
| defaultSalePrice  | BigDecimal | This is default price product |
| placeType  | UUID  | This is UUID of the cooking place type |
| defaultIncludeInMenu | Boolean  | Whether to include the position in the menu by default. |
| type  | Enum  |  Item type Code Name Code GOODS  This is ingredients DISH  This is an item PREPARED This is prepared SERVICE  This is service MODIFIER This is modifier OUTER  This is outer goods PETROL  This is petrol   |
| unitWeight  | BigDecimal  | This is unit weight in kg |
| unitCapacity  | BigDecimal  | This is unit capacity in liters |
| notInStoreMovement  | Boolean  | Participates in store movements. A service with such a setting in the store never comes to either an expense or an amount. |

##### 

##### Request example

| [http://localhost:8080/resto/api/v2/entities/products/list?includeDeleted=false](http://localhost:8080/resto/api/v2/entities/products/list?includeDeleted=false) |
| :---- |

| JSON Response |
| :---- |
| \[   {      "id":"567791bd-7881-4bcf-8f84-138ca9d0f53c",      "deleted":false,      "name":"product1",      "description":"",      "num":"00089",      "code":"95",      "parent":null,      "modifiers":\[         {            "modifier":"21ce6d98-8229-4cdd-a0ac-9f0c99a6347f",            "defaultAmount":0,            "freeOfChargeAmount":0,            "minimumAmount":0,            "maximumAmount":1,            "hideIfDefaultAmount":false,            "required":false,            "childModifiersHaveMinMaxRestrictions":false,            "splittable":false,            "childModifiers":\[               {                  "modifier":"6e1ecad4-e6a8-4887-b835-9639dacb7387",                  "defaultAmount":0,                  "freeOfChargeAmount":0,                  "minimumAmount":0,                  "maximumAmount":0,                  "hideIfDefaultAmount":false,                  "required":false,                  "childModifiersHaveMinMaxRestrictions":false,                  "splittable":false,                  "childModifiers":null               },               {                  "modifier":"f0272448-5527-4dcf-be1d-ea47db29c55b",                  "defaultAmount":0,                  "freeOfChargeAmount":0,                  "minimumAmount":0,                  "maximumAmount":0,                  "hideIfDefaultAmount":false,                  "required":false,                  "childModifiersHaveMinMaxRestrictions":false,                  "splittable":false,                  "childModifiers":null               }            \]         },         {            "modifier":"cbaa0430-0599-4499-b766-5bbddf7826aa",            "defaultAmount":0,            "freeOfChargeAmount":0,            "minimumAmount":0,            "maximumAmount":1,            "hideIfDefaultAmount":false,            "required":false,            "childModifiersHaveMinMaxRestrictions":false,            "splittable":false,            "childModifiers":null         }      \],      "taxCategory":null,      "category":null,      "accountingCategory":"8bc08505-c81d-075d-8572-af7b636d049b",      "color":{         "red":170,         "green":170,         "blue":170      },      "fontColor":{         "red":0,         "green":0,         "blue":0      },      "frontImageId":null,      "position":null,      "mainUnit":"7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc",      "excludedSections":null,      "defaultSalePrice":0,      "placeType":null,      "defaultIncludedInMenu":false,      "type":"GOODS",      "unitWeight":1,      "unitCapacity":0,      "notInStoreMovement":false   },   {      "id":"b2f105b2-a9bd-4055-ab7b-13cb3662015a",      "deleted":false,      "name":"Item+barcode",      "description":"",      "num":"00051",      "code":"56",      "parent":null,      "modifiers":\[      \],      "taxCategory":null,      "category":null,      "accountingCategory":"8bc08505-c81d-075d-8572-af7b636d049b",      "color":{         "red":170,         "green":170,         "blue":170      },      "fontColor":{         "red":0,         "green":0,         "blue":0      },      "frontImageId":null,      "position":null,      "mainUnit":"6040d92d-e286-f4f9-a613-ed0e6fd241e1",      "excludedSections":null,      "defaultSalePrice":0,      "placeType":null,      "defaultIncludedInMenu":false,      "type":"DISH",      "unitWeight":3.71444,      "unitCapacity":0,      "notInStoreMovement":false   } \] |

## Import 

| HTTP Метод  | POST |
| :---- | :---- |
| URI  | entities/products/save  |
| Parameters |  Name Parameter Type Description  generateNomenclatureCode Boolean Whether it is necessary to generate the SKU of the stock items. Value default is true. He is\`t required generateFastCode  Boolean Whether it is necessary to generate a code for a quick search for an ite. Value default is true. He is\`t required  |
| Body |  Name Parameter Type Description  deleted  Boolean  Value is true, if the product is deleted name String  This is name product description  String  This is description product num  String  This is SKU product. Value is required, if **generateNomenclatureCode** is false code String  This is the speed dial code for the front. If generateFastCode \== false and the field is not set, it will be created empty. parent  UUID This is UUID parent group product. If the product belongs to the parent group, then parent \== null. ***To next page***  modifiers  UUID  Parameter name Type Description  modifier  UUID  his is modifier UUID or UUID nomenclature group, if this is group modifier. defaultAmount Integer  This is the default amount freeOfChargeAmount  Integer  This is amount of free modifiers  minimumAmount  Integer  This is minimum amount modifiers maximumAmount  Integer  This is maximum amount modifiers hideIfDefaultAmount  Boolean  Hide if amount is default required  Boolean  Value is true, if modifier is required childModifiersHaveMinMaxRestrictions  Boolean  Min. Max. amount of child modifiers. splittable Boolean  Sign of divisibility of the modifier. Used only in modifier schemes childModifiers  List\<ChoiceBindingDto\> This is children modifiers taxCategory  UUID  This is UUID tax category category UUID  This is custom category color  RGBColorDto  This is custom category Name Parameter Type Description  red  Integer  This is value for red color green  Integer  This is value for green color blue  Integer  This is value for blue color fontColor  RGBColorDto  This is font color in Syrve POS frontImageId  UUID  This is UUID product image for Syrve POS  position  Integer  This is position in menu   mainUnit  UUID  This is UUID main unit product excludedSections  Set\<UUID\>  Multiple UUIDs of restaurant branches that cannot sell this product defaultSalePrice  BigDecimal  This is default price product placeType  UUID  This is UUID of the cooking place type defaultIncludeInMenu Boolean  Whether to include the position in the menu by default. type Enum  Item type Code Name Code GOODS  This is ingredients DISH  This is an item PREPARED This is prepared SERVICE  This is service MODIFIER This is modifier OUTER  This is outer goods PETROL  This is petrol  unitCapacity  BigDecimal  This is unit capacity in liters notInStoreMovement  Boolean Participates in store movements. A service with such a setting in the store never comes to either an expense or an amount.  |

### Body

| JSON |
| :---- |
| {      "name":"Product created via api",    "description":"test",    "parent":null,    "modifiers":\[     	{        	"modifier":"21ce6d98-8229-4cdd-a0ac-9f0c99a6347f",      	"defaultAmount":0,      	"freeOfChargeAmount":0,      	"minimumAmount":0,      	"maximumAmount":1,      	"hideIfDefaultAmount":false,      	"required":false,      	"childModifiersHaveMinMaxRestrictions":false,      	"splittable":false,      	"childModifiers":\[           	{              	"modifier":"6e1ecad4-e6a8-4887-b835-9639dacb7387",            	"defaultAmount":0,            	"freeOfChargeAmount":0,            	"minimumAmount":0,            	"maximumAmount":0,            	"hideIfDefaultAmount":false,            	"required":false,            	"childModifiersHaveMinMaxRestrictions":false,            	"splittable":false,            	"childModifiers":null         	},         	{              	"modifier":"f0272448-5527-4dcf-be1d-ea47db29c55b",            	"defaultAmount":0,            	"freeOfChargeAmount":0,            	"minimumAmount":0,            	"maximumAmount":0,            	"hideIfDefaultAmount":false,            	"required":false,            	"childModifiersHaveMinMaxRestrictions":false,            	"splittable":false,            	"childModifiers":null         	}      	\]   	},   	{        	"modifier":"cbaa0430-0599-4499-b766-5bbddf7826aa",      	"defaultAmount":0,      	"freeOfChargeAmount":0,      	"minimumAmount":0,      	"maximumAmount":1,      	"hideIfDefaultAmount":false,      	"required":false,      	"childModifiersHaveMinMaxRestrictions":false,      	"splittable":false,      	"childModifiers":null   	}    \],    "taxCategory":null,    "category":null,    "color":{     	"red":170,   	"green":170,   	"blue":170    },    "fontColor":{     	"red":0,   	"green":0,   	"blue":0    },    "frontImageId":null,    "position":null,    "mainUnit":"7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc",    "excludedSections":null,    "defaultSalePrice":0,    "placeType":null,    "defaultIncludedInMenu":false,    "type":"GOODS",    "unitWeight":1,    "unitCapacity":0,    "notInStoreMovement":false } |

| Result  | Json structure of the import result. |
| :---- | :---- |
| Desctiption  | This is import result |

##### Request example

| [http://localhost:8080/resto/api/v2/entities/products/save](http://localhost:8080/resto/api/v2/entities/products/save) |
| :---- |

| JSON |
| :---- |
| {      "name":"Product created via api",    "description":"test",    "parent":null,    "modifiers":\[     	{        	"modifier":"21ce6d98-8229-4cdd-a0ac-9f0c99a6347f",      	"defaultAmount":0,      	"freeOfChargeAmount":0,      	"minimumAmount":0,      	"maximumAmount":1,      	"hideIfDefaultAmount":false,      	"required":false,      	"childModifiersHaveMinMaxRestrictions":false,      	"splittable":false,      	"childModifiers":\[           	{              	"modifier":"6e1ecad4-e6a8-4887-b835-9639dacb7387",            	"defaultAmount":0,            	"freeOfChargeAmount":0,            	"minimumAmount":0,            	"maximumAmount":0,            	"hideIfDefaultAmount":false,            	"required":false,            	"childModifiersHaveMinMaxRestrictions":false,            	"splittable":false,            	"childModifiers":null         	},         	{              	"modifier":"f0272448-5527-4dcf-be1d-ea47db29c55b",            	"defaultAmount":0,            	"freeOfChargeAmount":0,            	"minimumAmount":0,            	"maximumAmount":0,            	"hideIfDefaultAmount":false,            	"required":false,            	"childModifiersHaveMinMaxRestrictions":false,            	"splittable":false,            	"childModifiers":null         	}      	\]   	},   	{        	"modifier":"cbaa0430-0599-4499-b766-5bbddf7826aa",      	"defaultAmount":0,      	"freeOfChargeAmount":0,      	"minimumAmount":0,      	"maximumAmount":1,      	"hideIfDefaultAmount":false,      	"required":false,      	"childModifiersHaveMinMaxRestrictions":false,      	"splittable":false,      	"childModifiers":null   	}    \],    "taxCategory":null,    "category":null,    "color":{     	"red":170,   	"green":170,   	"blue":170    },    "fontColor":{     	"red":0,   	"green":0,   	"blue":0    },    "frontImageId":null,    "position":null,    "mainUnit":"7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc",    "excludedSections":null,    "defaultSalePrice":0,    "placeType":null,    "defaultIncludedInMenu":false,    "type":"GOODS",    "unitWeight":1,    "unitCapacity":0,    "notInStoreMovement":false } |

## Editing

| HTTP Метод  | POST |
| :---- | :---- |
| URI  | entities/products/update?overrideNomenclatureCode={overrideNomenclatureCode}\&overrideFastCode={overrideFastCode}  |
| Body |  Name Parameter Type Description  id  UUID This is UUID Item element  deleted  Boolean  Value is true, if the product is deleted name String  This is name product description  String  This is description product num  String  This is SKU product. Value is required, if **generateNomenclatureCode** is false code String  This is the speed dial code for the front. If generateFastCode \== false and the field is not set, it will be created empty. parent  UUID This is UUID parent group product. If the product belongs to the parent group, then parent \== null. ***To next page***  modifiers  UUID  Parameter name Type Description  modifier  UUID  his is modifier UUID or UUID nomenclature group, if this is group modifier. defaultAmount Integer  This is the default amount freeOfChargeAmount  Integer  This is amount of free modifiers  minimumAmount  Integer  This is minimum amount modifiers maximumAmount  Integer  This is maximum amount modifiers hideIfDefaultAmount  Boolean  Hide if amount is default required  Boolean  Value is true, if modifier is required childModifiersHaveMinMaxRestrictions  Boolean  Min. Max. amount of child modifiers. splittable Boolean  Sign of divisibility of the modifier. Used only in modifier schemes childModifiers  List\<ChoiceBindingDto\> This is children modifiers taxCategory  UUID  This is UUID tax category category UUID  This is custom category color  RGBColorDto  This is custom category Name Parameter Type Description  red  Integer  This is value for red color green  Integer  This is value for green color blue  Integer  This is value for blue color fontColor  RGBColorDto  This is font color in Syrve POS frontImageId  UUID  This is UUID product image for Syrve POS  position  Integer  This is position in menu   mainUnit  UUID  This is UUID main unit product excludedSections  Set\<UUID\>  Multiple UUIDs of restaurant branches that cannot sell this product defaultSalePrice  BigDecimal  This is default price product placeType  UUID  This is UUID of the cooking place type defaultIncludeInMenu Boolean  Whether to include the position in the menu by default. type Enum  Item type Code Name Code GOODS  This is ingredients DISH  This is an item PREPARED This is prepared SERVICE  This is service MODIFIER This is modifier OUTER  This is outer goods PETROL  This is petrol  unitCapacity  BigDecimal  This is unit capacity in liters notInStoreMovement  Boolean Participates in store movements. A service with such a setting in the store never comes to either an expense or an amount.  |

### Body 

| JSON |
| :---- |
| {    "id":"fcdf4324-4a2f-f250-0162-d3887cf1005d",    "name":"Product created via api",    "description":"test",    "parent":null,    "modifiers":\[   	{      	"modifier":"21ce6d98-8229-4cdd-a0ac-9f0c99a6347f",      	"defaultAmount":0,      	"freeOfChargeAmount":0,      	"minimumAmount":0,      	"maximumAmount":1,      	"hideIfDefaultAmount":false,      	"required":false,      	"childModifiersHaveMinMaxRestrictions":false,      	"splittable":false,      	"childModifiers":\[         	{            	"modifier":"6e1ecad4-e6a8-4887-b835-9639dacb7387",            	"defaultAmount":0,            	"freeOfChargeAmount":0,            	"minimumAmount":0,            	"maximumAmount":0,            	"hideIfDefaultAmount":false,            	"required":false,            	"childModifiersHaveMinMaxRestrictions":false,            	"splittable":false,            	"childModifiers":null         	},         	{            	"modifier":"f0272448-5527-4dcf-be1d-ea47db29c55b",            	"defaultAmount":0,            	"freeOfChargeAmount":0,            	"minimumAmount":0,            	"maximumAmount":0,            	"hideIfDefaultAmount":false,            	"required":false,            	"childModifiersHaveMinMaxRestrictions":false,            	"splittable":false,            	"childModifiers":null         	}      	\]   	},   	{      	"modifier":"cbaa0430-0599-4499-b766-5bbddf7826aa",      	"defaultAmount":0,      	"freeOfChargeAmount":0,      	"minimumAmount":0,      	"maximumAmount":1,      	"hideIfDefaultAmount":false,      	"required":false,      	"childModifiersHaveMinMaxRestrictions":false,      	"splittable":false,      	"childModifiers":null   	}    \],    "taxCategory":null,    "category":null,    "color":{   	"red":170,   	"green":170,   	"blue":170    },    "fontColor":{   	"red":0,   	"green":0,   	"blue":0    },    "frontImageId":null,    "position":null,    "mainUnit":"7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc",    "excludedSections":null,    "defaultSalePrice":0,    "placeType":null,    "defaultIncludedInMenu":false,    "type":"GOODS",    "unitWeight":1,    "unitCapacity":0,    "notInStoreMovement":false } |

### Parameters

| Name Parameters | Type | Description |
| :---- | :---- | :---- |
| overrideFastCode  | Boolean  | Changing the speed dial code. Default value is false |
| overrideNomenclatureCode | Boolean  | Changing the SKU. Default value is false |

##### Request example

| http://localhost:8080/resto/api/v2/entities/products/update?overrideFastCode=false\&overrideNomenclatureCode=false  |
| :---- |

| JSON |
| :---- |
| {    "id":"fcdf4324-4a2f-f250-0162-d3887cf1005d",    "deleted":false,    "name":"Test",    "description":"test",    "modifiers":null,    "taxCategory":"ccf8be1e-4b39-478a-8c79-940af8c6cd02",    "color":{   	"red":170,   	"green":170,   	"blue":170    },    "fontColor":{   	"red":0,   	"green":0,   	"blue":0    },    "frontImageId":null,    "position":null,    "mainUnit":"7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc",    "excludedSections":null,    "defaultSalePrice":80,    "placeType":"7bce50f2-c5d0-1bb7-5194-8d2e55752764",    "defaultIncludedInMenu":true,    "type":"GOODS",    "unitCapacity":0,    "notInStoreMovement":false } |

## Remove

| HTTP Method  | POST  |
| :---- | :---- |
| URI | entities/products/delete |
| Result  | JSON Response |
| Body |  entity Type Value id UUID UUID items element  |

### Body

| JSON |
| :---- |
| {    "items":\[   	{      	"id":"fcdf4324-4a2f-f250-0162-d3887cf1005d"   	}    \] } |

#### Request example

| http://localhost:8080/resto/api/v2/entities/products/delete  |
| :---- |

| JSON |
| :---- |
| {    "items":\[   	{      	"id":"fcdf4324-4a2f-f250-0162-d3887cf1005d"   	}    \] } |

## Recovery

| HTTP Method  | POST  |
| :---- | :---- |
| URI | entities/products/restore |
| Result  | JSON Response |
| Body | Body |

#### Request example

| http://localhost:8080/resto/api/v2/entities/products/restore |
| :---- |

| JSON |
| :---- |
| {    "items":\[   	{      	"id":"fcdf4324-4a2f-f250-0162-d3887cf1005d"   	}    \] } |

## 

## Items group

### Get Items group

| HTTP Method  | GET  |
| :---- | :---- |
| URI | entities/products/group/list?includeDeleted={includeDeleted} |
| Result  | This is list items group |

#### Parameters

| Name Parameters | Type | Description |
| :---- | :---- | :---- |
| includeDeleted  | Boolean  | Removed elements are included in the result. Value default is false. |
| ids  | List\<UUID\> | This is id items elements |
| parentIds  | List\<UUID\> | This is id parent group |

#### Result

| Name Parameters | Type | Description |
| :---- | :---- | :---- |
| id  | UUID  | This is id items group |
| deleted  | Boolean  | Value is true if items group is remove |
| name  | String  | This is name items group |
| description | String  | This is description |
| num  | String  | This is SKU |
| code | String  | This is the speed dial code for the front |
| parent  | UUID  | This is id parent group |
| modifiers  | List\<ChoiceBindingDto\>  | This is modifiers.(Items group has no modifiers ) |
| taxCategory  | UUID  | This is uuid tax cetegory |
| category  | UUID  | This is custom category |
| accountingCategory | UUID  | This is accounting category |
| color  | RGBColorDto  | This is the color of the  button  |
| fontColor  | RGBColorDto  | This is font color in Syrve POS |
| frontImageId  | UUID | This is UUID product image for Syrve POS  |
| position  | Integer  | This is position in menu   |
| visibilityFilter | DepartmentFilterDto |  Name Parameters Type Description departments List\<UUID\>  This is UUID departaments excluding  Boolean  This is the parameter that includes or excludes the filter  |

#### Request example

| http://localhost:8080/resto/api/v2/entities/products/group/list?includeDeleted=false  |
| :---- |

| JSON |
| :---- |
| \[    {   	"id":"b48f8846-2395-44bb-938d-1e208b753e6d",   	"deleted":false,   	"name":"Modifiers group",   	"description":"",   	"num":"00093",   	"code":"98",   	"parent":null,   	"modifiers":\[\],   	"taxCategory":null,   	"category":"29ea3800-550b-9b01-015d-46c07c208cdf",   	"accountingCategory":"8bc08505-c81d-075d-8572-af7b636d049b",   	"color":{      	"red":119,      	"green":119,      	"blue":119   	},   	"fontColor":{      	"red":0,      	"green":0,      	"blue":0   	},   	"frontImageId":"67ae50d5-d1b1-4afb-9d04-469aa49a2e05",   	"position":null,   	"visibilityFilter":{     	"departments":\[       	"a90efd2e-eb0c-4588-8ab1-a56248f129ef"     	\],     	"excluding": false   	} 	},    {   	"id":"9a57844b-cb39-4366-8fd8-423c18e1fef2",   	"deleted":false,   	"name":"Remove",   	"description":"",   	"num":"0094",   	"code":"100",   	"parent":"cc455ea0-ad9a-4c28-a350-4d383fb4b71b",   	"modifiers":\[     	\],   	"taxCategory":null,   	"category":null,   	"accountingCategory":"8bc08505-c81d-075d-8572-af7b636d049b",   	"color":{      	"red":119,      	"green":119,      	"blue":119   	},   	"fontColor":{      	"red":255,      	"green":255,      	"blue":255   	},   	"frontImageId":null,   	"position":null,   	"visibilityFilter":null    },    {   	"id":"cc455ea0-ad9a-4c28-a350-4d383fb4b71b",   	"deleted":false,   	"name":"Modifiers ",   	"description":"",   	"num":"0004",   	"code":"26",   	"parent":null,   	"modifiers":\[\],   	"taxCategory":null,   	"category":null,   	"accountingCategory":"8bc08505-c81d-075d-8572-af7b636d049b",   	"color":{      	"red":119,      	"green":119,      	"blue":119   	},   	"fontColor":{      	"red":255,      	"green":255,      	"blue":255   	},   	"frontImageId":null,   	"position":null,   	"visibilityFilter":null    },    {   	"id":"1f77c821-f206-407e-abdf-5469c11d5061",   	"deleted":false,   	"name":"cycle",   	"description":"",   	"num":"0003",   	"code":"25",   	"parent":null,   	"modifiers":\[\],   	"taxCategory":null,   	"category":null,   	"accountingCategory":"8bc08505-c81d-075d-8572-af7b636d049b",   	"color":{      	"red":119,      	"green":119,      	"blue":119   	},   	"fontColor":{      	"red":255,      	"green":255,      	"blue":255   	},   	"frontImageId":null,   	"position":null,   	"visibilityFilter":null 	} \] |

### Import items group

| HTTP Method  | POST  |
| :---- | :---- |
| URI | entities/products/group/save  |
| Body |  Name Type Description deleted  Boolean  Value is true if items group is remove name  String This is name items group description  String  This is description parent  UUID  This is id parent group taxCategory  UUID  This is uuid tax cetegory category  UUID  This is custom category color  RGBColorDto  This is the color of the  button  fontColor  RGBColorDto  This is font color in Syrve POS frontImageId  UUID  This is UUID product image for Syrve POS  position  UUID  This is position in menu    |
| Result  | JSON structure import  |

#### Request example

| http://localhost:8080/resto/api/v2/entities/products/save  |
| :---- |

| JSON |
| :---- |
| {    "name":"Group 1",    "description":"test",    "parent":"b48f8846-2395-44bb-938d-1e208b753e6d",    "taxCategory":null,    "category":null,    "color":{   	"red":170,   	"green":170,   	"blue":170    },    "fontColor":{   	"red":0,   	"green":0,   	"blue":0    },    "frontImageId":"67ae50d5-d1b1-4afb-9d04-469aa49a2e05",    "position":null } |

### Editing items group

| HTTP Method  | POST  |
| :---- | :---- |
| URI | entities/products/group/update  |
| Body |  Name Type Description id  UUID  This is id items group deleted  Boolean  Value is true if items group is remove name  String This is name items group description  String  This is description parent  UUID  This is id parent group taxCategory  UUID  This is uuid tax cetegory category  UUID  This is custom category color  RGBColorDto  This is the color of the  button  fontColor  RGBColorDto  This is font color in Syrve POS frontImageId  UUID  This is UUID product image for Syrve POS   |

#### Body

| JSON |
| :---- |
| {    "id":"68569fd5-17bc-382b-0165-0a151ab6011e",    "name":"Group1",    "description":"test",    "parent":"b48f8846-2395-44bb-938d-1e208b753e6d",    "taxCategory":null,    "category":null,    "color":{   	"red":170,   	"green":170,   	"blue":170    },    "fontColor":{   	"red":100,   	"green":0,   	"blue":0    },    "frontImageId":"67ae50d5-d1b1-4afb-9d04-469aa49a2e05",    "position":null } |

#### Request example

| http://localhost:8080/resto/api/v2/entities/products/update?overrideFastCode=false\&overrideNomenclatureCode=false  |
| :---- |

| JSON |
| :---- |
| {    "id":"68569fd5-17bc-382b-0165-0a151ab6011e",    "name":"Group1",    "description":"test",    "parent":"b48f8846-2395-44bb-938d-1e208b753e6d",    "taxCategory":null,    "category":null,    "color":{   	"red":170,   	"green":170,   	"blue":170    },    "fontColor":{   	"red":100,Syrve API Server \- Google Документы   	"green":0,   	"blue":0    },    "frontImageId":"67ae50d5-d1b1-4afb-9d04-469aa49a2e05",    "position":null } |

### Remove items group

| HTTP Method  |  POST  |
| :---- | :---- |
| URI | entities/products/group/delete  |
| Body | ProductsAndGroupsDto\<IdListDto IdListDto\>  Name Type Description products  IdListDto This is list id items positions productGroups  IdListDto This is list id items group  |

#### Body

| JSON |
| :---- |
| {    "products":{   	"items":\[      	{         	"id":"883CB6A8-621D-4BFB-8595-403E41BE62E8"      	},      	{         	"id":"6E1ECAD4-E6A8-4887-B835-9639DACB7387"      	}   	\]    },    "productGroups":{   	"items":\[      	{         	"id":"e10037a7-7e1f-4296-9e2c-a2c9ac551711"      	},      	{         	"id":"cc455ea0-ad9a-4c28-a350-4d383fb4b71b"      	}   	\]    } } |

#### Request example

| http://localhost:8080/resto/api/v2/entities/products/group/delete  |
| :---- |

| JSON |
| :---- |
| {    "products":{   	"items":\[      	{         	"id":"883CB6A8-621D-4BFB-8595-403E41BE62E8"      	},      	{         	"id":"6E1ECAD4-E6A8-4887-B835-9639DACB7387"      	}   	\]    },    "productGroups":{   	"items":\[      	{         	"id":"e10037a7-7e1f-4296-9e2c-a2c9ac551711"      	},      	{         	"id":"cc455ea0-ad9a-4c28-a350-4d383fb4b71b"      	}   	\]    } } |

### Restore items group 

| HTTP Method  | POST |
| :---- | :---- |
| URI | entities/products/group/restore  |
| Body | ProductsAndGroupsDto\<IdListDto IdListDto\>  Name Type Description products  IdListDto This is list id items positions productGroups  IdListDto This is list id items group  |

## Custom category 

### Get custom category

| HTTP Method  | GET  |
| :---- | :---- |
| URI | entities/products/category/list  |

#### Parameters

| Name Parameters | Type | Description |
| :---- | :---- | :---- |
| includeDeleted  | Boolean | Removed elements are included in the result. Value default is false. |
| ids  | List\<UUID\> | This is id elements |

#### Result

| Name Parameters | Type | Description |
| :---- | :---- | :---- |
| id  | UUID | This is id custom category |
| rootType  | String  | "ProductCategory"  |
| deleted  | Boolean | Value is true is custom category is remove |
| code  | String  | null  |
| name  | String  | This is name category  |

#### Request example

| http://localhost:8080/resto/api/v2/entities/products/category/list  |
| :---- |

#### 

| JSON |
| :---- |
| \[{   "id":"7e29cd73-05da-7ac4-0165-0f11a132002b",   "rootType":"ProductCategory",   "deleted":false,   "code":null,   "name":"Category 1" }\] |

### Import custom category

| HTTP Method  | POST  |
| :---- | :---- |
| URI | entities/products/category/save  |
| Body |  Name Type Description name String  This is name custom category  |

#### Request example

| http://localhost:8080/resto/api/v2/entities/products/category/save |
| :---- |

#### 

| JSON |
| :---- |
| {      "name":"Category 1" } |

Response

| JSON |
| :---- |
| {      "result":"SUCCESS",    "errors":null,    "response":{     	"id":"7e29cd73-05da-7ac4-0165-0f11a132002b",   	"rootType":"ProductCategory",   	"deleted":false,   	"code":null,   	"name":"Category 1"    } } |

### Editing custom category

| HTTP Method  | POST |
| :---- | :---- |
| URI | entities/products/category/update  |
| Body |  Name Type Description name String  This is name custom category id UUID This is id custom category  |

#### Request example

| http://localhost:8080/resto/api/v2/entities/products/category/save  |
| :---- |

| JSON |
| :---- |
| {    "id":"70936cd4-474d-4b5f-b9bc-ac2799bfc137",    "name":"Category 2" } |

### Remove custom category

| HTTP Method  |  POST  |
| :---- | :---- |
| URI | entities/products/category/delete  |
| Body |  Name Type Description id  UUID  This is  id custom category  |

#### Request example

| http://localhost:8080/resto/api/v2/entities/products/category/delete  |
| :---- |

| JSON |
| :---- |
| {    "id":"70936cd4-474d-4b5f-b9bc-ac2799bfc137" } |

### Restore custom category 

| HTTP Method  | POST |
| :---- | :---- |
| URI | entities/products/category/restore |
| Body |  Name Type Description id  UUID  This is  id custom category  |

#### 

#### Request example

| http://localhost:8080/resto/api/v2/entities/products/category/restore  |
| :---- |

| JSON |
| :---- |
| {   "id":"70936cd4-474d-4b5f-b9bc-ac2799bfc137" } |

# 

# Documents

## Import and edit an incoming invoice

| HTTP Method  | POST |
| :---- | :---- |
| URI | / documents /import /incomingInvoice  |
| Header | Content-Type: application/xml  |
| Body  | Document structure |
| Result  | DocumentValidationResult structure |

#### 

### Product count example

One of the product in purchase invoice has packaging unit in boxes and the base unit in kg  
Example. You have 5 boxes by 10 kg in every box.  
Then fill in the fields:  
\- \<amount\> \- 50   
\- \<actualAmount\> \- 50  
Otherwise fill in the quantity items in base unit. 

Request example

| XML |
| :---- |
| POST http://localhost:8080/resto/api/documents/import/incomingInvoice?key=ddb22676-38a7-afb4-d02a-d5f6898d64cc  HTTP/1.1 Content-Type: application/xml Host: localhost:8080 Content-Length: 2195 \<document\>   \<items\> 	\<item\>   	\<amount\>3.00\</amount\>   	 \<supplierProduct\>BF1DA0F2-B511-431E-BC7D-F2A68715054B\</supplierProduct\>   	\<product\>0F22AA60-E8AE-4C8E-80CD-F1E00B88FEC6\</product\>   	\<num\>1\</num\>   	\<containerId\>00000000-0000-0000-0000-000000000000\</containerId\>   	\<amountUnit\>6040D92D-E286-F4F9-A613-ED0E6FD241E1\</amountUnit\>   	\<actualUnitWeight/\>   	\<discountSum\>0.00\</discountSum\>   	\<sumWithoutNds\>30.00\</sumWithoutNds\>   	\<ndsPercent\>0.00\</ndsPercent\>   	\<sum\>30.00\</sum\>   	\<priceUnit/\>   	\<price\>10.00\</price\>   	\<code\>25753\</code\>   	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>   	\<customsDeclarationNumber\>cdn-7\</customsDeclarationNumber\>   	\<actualAmount\>3.00\</actualAmount\> 	\</item\>   \<item\>   	\<amount\>4.00\</amount\>   	\<supplierProduct\>18C66E42-9A71-402A-81B0-A0DAA8E74F4B\</supplierProduct\>   	\<product\>B2D954CE-FC7A-44FF-9987-35AF59F16966\</product\>   	\<num\>2\</num\>   	\<containerId\>00000000-0000-0000-0000-000000000000\</containerId\>   	\<amountUnit\>6040D92D-E286-F4F9-A613-ED0E6FD241E1\</amountUnit\>   	\<actualUnitWeight/\>   	\<discountSum\>0.00\</discountSum\>   	\<sumWithoutNds\>80.00\</sumWithoutNds\>   	\<ndsPercent\>0.00\</ndsPercent\>   	\<sum\>80.00\</sum\>   	\<priceUnit/\>   	\<price\>20.00\</price\>   	\<code\>25752\</code\>   	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>   	\<customsDeclarationNumber\>cdn-7\</customsDeclarationNumber\>   	\<actualAmount\>4.00\</actualAmount\> 	\</item\>   \</items\>   \<conception\>2609B25F-2180-BF98-5C1C-967664EEA837\</conception\>   \<comment\>comment-7\</comment\>   \<documentNumber\>dn-7\</documentNumber\>   \<dateIncoming\>17.12.2014\</dateIncoming\>   \<useDefaultDocumentTime\>true\</useDefaultDocumentTime\>   \<invoice\>in-7\</invoice\>   \<defaultStore\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</defaultStore\>   \<supplier\>3F08E41C-AA25-4573-B1E0-60B3B8A09F6A\</supplier\>   \<dueDate\>27.12.2014\</dueDate\>   \<incomingDocumentNumber\>idn-7\</incomingDocumentNumber\>   \<employeePassToAccount\>9e1a4e13-f811-4dea-94b4-575b2cf0f2f8\</employeePassToAccount\>   \<transportInvoiceNumber\>tin-7\</transportInvoiceNumber\> \</document\> |

### XSD Validations result

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="documentValidationResult" type="documentValidationResult"/\>   	\<xs:complexType name="documentValidationResult"\>     	\<xs:sequence\>         	\<\!-- Validations result. \--\>         	\<xs:element name="valid" type="xs:boolean"/\>         	\<\!-- This is a warning that the error is not critical  \--\>         	\<xs:element name="warning" type="xs:boolean"/\>         	\<\!-- Number validations documents. \--\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="0"/\>         	\<\!-- New document number. The value is null if the old number isn\`t unique or the field has not   changed  \--\>         	\<xs:element name="otherSuggestedNumber" type="xs:string" minOccurs="0"/\>         	\<\!--This\`s error text--\>         	\<xs:element name="errorMessage" type="xs:string" minOccurs="0"/\>         	\<\!--  For an unreliable result, additional information containing information about errors can be indicated.         For example, for information disclosure in minus this field contains detailed information on each position of the document,         leading to negative balances. \--\>         	\<xs:element name="additionalInfo" type="xs:string" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\> |

### XSD Incoming invoice {#xsd-incoming-invoice}

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="document" type="incomingInvoiceDto"/\>   	\<xs:complexType name="incomingInvoiceDto"\>     	\<xs:sequence\>         	\<\!--Document positions--\>         	\<xs:element name="items" minOccurs="0"\>             	\<xs:complexType\>                 	\<xs:sequence\>                     	\<xs:element name="item" type="incomingInvoiceItemDto" minOccurs="0" maxOccurs="unbounded"/\>                 	\</xs:sequence\>             	\</xs:complexType\>         	\</xs:element\>         	\<\!--         	 Document Id (only reading)         	\--\>         	\<xs:element name="id" type="xs:string" minOccurs="0"/\>         	\<\!--Conception (guid)--\>         	\<xs:element name="conception" type="xs:string" minOccurs="0"/\>         	\<\!--         	Code conception         	\--\>         	\<xs:element name="conceptionCode" type="xs:string" minOccurs="0"/\>         	\<\!--Comment--\>         	\<xs:element name="comment" type="xs:string" minOccurs="0"/\>         	\<\!--Number document accounting \--\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="0"/\>         	\<\!--         	Date document in format:         	yyyy-MM-ddTHH:mm:ss, yyyy-MM-dd.         	\--\>         	\<xs:element name="dateIncoming" type="xs:string" minOccurs="0"/\>         	\<\!-- Number Invoice \--\>         	\<xs:element name="invoice" type="xs:string" minOccurs="0"/\>         	\<\!--Store. \--\>         	\<xs:element name="defaultStore" type="xs:string" minOccurs="0"/\>         	\<\!--Supplier--\>         	\<xs:element name="supplier" type="xs:string" minOccurs="0"/\>         	\<\!--         	This is the payment due date in format:         	yyyy-MM-ddTHH:mm:ss          	\--\>         	\<xs:element name="dueDate" type="xs:string" minOccurs="0"/\>         	\<\!--         This\`s date for the external document in format  yyyy-MM-dd.            	\--\>         	\<xs:element name="incomingDate" type="xs:string" minOccurs="0"/\>         	\<\!--         	false(Value default is false ):Method uses date and time with dateIncoming.         	true: The method uses the settings of the documents they are in the group:          	\*Current time \- edit date and time with line dateIncoming;          	\* "Specified time" or "Shift closing time" \- edit date with dateIncoming, edit time with settings of the documents.         	\--\>         	\<xs:element name="useDefaultDocumentTime" type="xs:boolean" minOccurs="0" default="false"/\>         	\<xs:element name="status" type="documentStatus" minOccurs="0"/\>         	\<\!--External document number \--\>         	\<xs:element name="incomingDocumentNumber" type="xs:string" minOccurs="0"/\>         	\<\!--Employee--\>         	\<xs:element name="employeePassToAccount" type="xs:string" minOccurs="0"/\>         	\<\!--Number shipping document \--\>         	\<xs:element name="transportInvoiceNumber" type="xs:string" minOccurs="0"/\>         	\<\!--         	This\`s UUID additional  purchase invoice         	(This\`s for read informations)         	\--\>         	\<xs:element name="linkedOutgoingInvoiceId" type="xs:string" minOccurs="0"/\>         	          	\<\!--             This’s an algorithm for allocating costs 	(This\`s for read informations)         	\--\>         	\<xs:element name="distributionAlgorithm" type="distributionAlgorithmType" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<\!--This\`s document position  \--\> 	\<xs:complexType name="incomingInvoiceItemDto"\>     	\<xs:sequence\>         	\<\!--         	Is an additional cost         	(This\`s for read informations)                   \--\>         	\<xs:element name="isAdditionalExpense" type="xs:boolean" minOccurs="0" default="false"/\>          	\<\!--Quantity of a product in its basic units of measurement--\>         	\<xs:element name="amount" type="xs:decimal" minOccurs="0"/\>         	\<\!--This\`s supplier product (guid)--\>         	\<xs:element name="supplierProduct" type="xs:string" minOccurs="0"/\>         	\<\!--This\`s supplier product (SKU)--\>         	\<xs:element name="supplierProductArticle" type="xs:string" minOccurs="0"/\>         	\<\!--Item (guid). This lines must be filled: product or productArticle.--\>         	\<xs:element name="product" type="xs:string" minOccurs="0"/\>         	\<\!--Product (SKU).--\>         	\<xs:element name="productArticle" type="xs:string" minOccurs="0"/\>         	\<\!--Manufacturer/importer. Must be included in the list of manufacturers/importers in the product card:         Commodity \- Additional Information \- Alcohol Declaration \- Producer/Importer--\>         	\<xs:element name="producer" type="xs:string" minOccurs="0"/\>         	\<\!--This\`s number item in the document. This\`s line required .--\>         	\<xs:element name="num" type="xs:int" minOccurs="1"/\>         	\<\!--Packing (guid)--\>         	\<xs:element name="containerId" type="xs:string" minOccurs="0"/\>         	\<\!-- Element  base amount unit(guid)--\>         	\<xs:element name="amountUnit" type="xs:string" minOccurs="0"/\>            	\<\!--         	This is the amount of the line without discount            	\--\>         	\<xs:element name="sum" type="xs:decimal" minOccurs="1"/\>             \<\!--         	The VAT percentage value and VAT amount for the document line.             If no amount is specified, it is calculated as a percentage.             If the percentage is not set, it is taken from the product card.             There is only a quantity that does not specify a percentage.         	\--\>         	\<xs:element name="vatPercent" type="xs:decimal" minOccurs="0"/\>         	\<xs:element name="vatSum" type="xs:decimal" minOccurs="0"/\>         	\<\!--Unit price--\>         	\<xs:element name="priceUnit" type="xs:string" minOccurs="0"/\>         	\<\!--Price for one.--\>         	\<xs:element name="price" type="xs:decimal" minOccurs="0"/\>         	\<\!--         	Price without VAT for packing including discount            	\--\>         	\<xs:element name="priceWithoutVat" type="xs:decimal" minOccurs="0"/\>            	\<\!--Storee--\>         	\<xs:element name="store" type="xs:string" minOccurs="0"/\>         	\<\!--Actual Quantity of Base Items--\>         	\<xs:element name="actualAmount" type="xs:decimal" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:simpleType name="documentStatus"\>     	\<xs:restriction base="xs:string"\>         	\<xs:enumeration value="NEW"/\>         	\<xs:enumeration value="PROCESSED"/\>         	\<xs:enumeration value="DELETED"/\>     	\</xs:restriction\>   	\</xs:simpleType\> 	  	\<xs:simpleType name="distributionAlgorithmType"\>     	\<xs:restriction base="xs:string"\>         	\<xs:enumeration value="DISTRIBUTION\_BY\_SUM"/\>         	\<xs:enumeration value="DISTRIBUTION\_BY\_AMOUNT"/\>         	\<xs:enumeration value="DISTRIBUTION\_NOT\_SPECIFIED"/\>     	\</xs:restriction\> 	\</xs:simpleType\> \</xs:schema\> |

## Import and edit an outgoing invoice

| HTTP Method  | POST |
| :---- | :---- |
| URI | /documents/import/outgoingInvoice  |
| Header | Content-Type: application/xml  |
| Body  | Document structure |
| Result  | DocumentValidationResult structure |

Request example

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<document\>    \<documentNumber\>400234\</documentNumber\>    \<dateIncoming\>2015-02-25T00:12:34\</dateIncoming\>    \<useDefaultDocumentTime\>true\</useDefaultDocumentTime\>    \<revenueAccountCode\>4.01\</revenueAccountCode\>    \<counteragentId\>48ae3720-abe9-5637-014f-7420d2640125\</counteragentId\>    \<items\>        \<item\>            \<productId\>99193cab-ee2b-4e76-9589-5b0d55ceaf05\</productId\>            \<productArticle\>00002\</productArticle\>            \<storeId\>7effd65d-3417-4924-a995-552f9520a048\</storeId\>            \<price\>30.000000000\</price\>            \<amount\>1.000000000\</amount\>            \<sum\>30.000000000\</sum\>            \<discountSum\>0.000000000\</discountSum\>        \</item\>    \</items\> \</document\> |

Result 

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<documentValidationResult\>    \<valid\>true\</valid\>    \<warning\>false\</warning\>    \<documentNumber\>400234\</documentNumber\> \</documentValidationResult\> |

### XSD Outgoing invoice {#xsd-outgoing-invoice}

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="document" type="outgoingInvoiceDto"/\>   	\<xs:complexType name="outgoingInvoiceDto"\>     	\<xs:sequence\>         	\<\!--         	Document Id((This\`s for read informations))         	         	\--\>         	\<xs:element name="id" type="xs:string" minOccurs="0"/\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="0"/\>         	\<\!--         	This\`s document time and date in format:         	yyyy-MM-ddTHH:mm:ss, yyyy-MM-dd (dd.MM.yyyy не рекомендуется).         	\--\>         	\<xs:element name="dateIncoming" type="xs:dateTime" minOccurs="0"/\>         	\<\!--         	false(Value default is false ):Method uses date and time with dateIncoming.         	true: The method uses the settings of the documents they are in the group:          	\*Current time \- edit date and time with line dateIncoming;          	\* "Specified time" or "Shift closing time" \- edit date with dateIncoming, edit time with     settings of the documents.         	\--\>          	\<xs:element name="useDefaultDocumentTime" type="xs:boolean" minOccurs="0" default="false"/\>         	\<xs:element name="status" type="documentStatus" minOccurs="0"/\>         	\<\!-- Account for write-off of goods (expenditure account). Value default is 5.01 ("Food consumption"). \--\>         	\<xs:element name="accountToCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Revenue account. Default "4.01" ("Sales revenue"). \--\>         	\<xs:element name="revenueAccountCode" type="xs:string" minOccurs="0"/\>         	\<\!--         	Storee (id or code).If the invoice is posted this line is required".         	\--\>         	\<xs:element name="defaultStoreId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="defaultStoreCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Supplier \--\>         	\<xs:element name="counteragentId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="counteragentCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Conception \--\>         	\<xs:element name="conceptionId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="conceptionCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Comment--\>         	\<xs:element name="comment" type="xs:string" minOccurs="0"/\>         	\<\!--         	This\`s UUID additional  purchase invoice         	(This\`s for read informations)        	         	\--\>         	\<xs:element name="linkedOutgoingInvoiceId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="items"\>             	\<xs:complexType\>                 	\<xs:sequence\>                     	\<xs:element name="item" type="outgoingInvoiceItemDto" minOccurs="0" maxOccurs="unbounded"/\>                 	\</xs:sequence\>             	\</xs:complexType\>         	\</xs:element\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:complexType name="outgoingInvoiceItemDto"\>     	\<xs:sequence\>         	\<\!-- Item element (id or SKU)--\>         	\<xs:element name="productId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="productArticle" type="xs:string" minOccurs="0"/\>         	\<\!--         	Storee (id or code). If the invoice is posted this line is required        	\--\>         	\<xs:element name="storeId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="storeCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Packing (id or код SKU) \--\>         	\<xs:element name="containerId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="containerCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Packing price including discount \--\>         	\<xs:element name="price" type="xs:decimal" minOccurs="1"/\>  	          	\<\!--         	Price without VAT for packing including discount         	(This\`s for read informations)           	\--\>         	\<xs:element name="priceWithoutVat" type="xs:decimal" minOccurs="0"/\>         	\<\!-- Quantity in base units--\>         	\<xs:element name="amount" type="xs:decimal" minOccurs="1"/\>         	\<\!--         	Line amount excluding discount.         	sum \== amount \* price / container \+ discountSum \+ vatSum          	\--\>         	\<xs:element name="sum" type="xs:decimal" minOccurs="1"/\>         	\<\!-- Discount summ \--\>         	\<xs:element name="discountSum" type="xs:decimal" minOccurs="0"/\>         	\<\!--         	The VAT percentage value and VAT amount for the document line.             If no amount is specified, it is calculated as a percentage.             If the percentage is not set, it is taken from the product card.             You cannot specify just the amount without specifying a percentage.         	\--\>         	\<xs:element name="vatPercent" type="xs:decimal" minOccurs="0"/\>         	\<xs:element name="vatSum" type="xs:decimal" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:simpleType name="documentStatus"\>     	\<xs:restriction base="xs:string"\>         	\<xs:enumeration value="NEW"/\>         	\<xs:enumeration value="PROCESSED"/\>         	\<xs:enumeration value="DELETED"/\>     	\</xs:restriction\> 	\</xs:simpleType\> \</xs:schema\> |

### 

### XSD Validations result

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="documentValidationResult" type="documentValidationResult"/\>   	\<xs:complexType name="documentValidationResult"\>     	\<xs:sequence\>         	\<\!-- Validations result. \--\>         	\<xs:element name="valid" type="xs:boolean"/\>         	\<\!-- This is a warning that the error is not critical  \--\>         	\<xs:element name="warning" type="xs:boolean"/\>         	\<\!-- Number validations documents. \--\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="0"/\>         	\<\!-- New document number. The value is null if the old number isn\`t unique or the field has not   changed  \--\>         	\<xs:element name="otherSuggestedNumber" type="xs:string" minOccurs="0"/\>         	\<\!--This\`s error text--\>         	\<xs:element name="errorMessage" type="xs:string" minOccurs="0"/\>         	\<\!--  For an unreliable result, additional information containing information about errors can be indicated.         For example, for information disclosure in minus this field contains detailed information on each position of the document,         leading to negative balances. \--\>         	\<xs:element name="additionalInfo" type="xs:string" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\> |

## Cancel the posting of incoming invoice and outgoing invoices

### Cancel the posting of purchase invoice

| HTTP Method  | POST |
| :---- | :---- |
| URI | **/documents/unprocess/incomingInvoice** |
| Header | Content-Type: application/xml |
| Body  | Document structure |
| Result  | DocumentValidationResult structure |

### Cancel the posting of outgoing invoice

| HTTP Method  | POST |
| :---- | :---- |
| URI | **/documents/unprocess/outgoingInvoice** |
| Header | Content-Type: application/xml |
| Body  | Document structure |
| Result  | DocumentValidationResult structure |

### XSD Validations result

| XML |
| :---- |
| \<?**xml** version\="1.0" encoding\="UTF-8" standalone\="yes"?\> \<**xs:schema** version\="1.0" xmlns:xs\="[http://www.w3.org/2001/XMLSchema"](http://www.w3.org/2001/XMLSchema)\>     \<**xs:element** name\="documentValidationResult" type\="documentValidationResult"/\>       \<\!--Validations result\--\>     \<**xs:complexType** name\="documentValidationResult"\>         \<**xs:sequence**\>             \<**xs:element** name\="valid" type\="xs:boolean"/\>           \<\!-- This is a warning that the error is not critical  \--\>             \<**xs:element** name\="warning" type\="xs:boolean"/\>             \<\!-- Number validations documents. \--\>             \<**xs:element** name\="documentNumber" type\="xs:string" minOccurs\="0"/\>             \<\!-- New document number. The value is null if the old number isn\`t unique or the field has not   changed  \--\>              \<**xs:element** name\="otherSuggestedNumber" type\="xs:string" minOccurs\="0"/\>             \<\!--This\`s error text--\>             \<**xs:element** name\="errorMessage" type\="xs:string" minOccurs\="0"/\>             \<\!--  For an unreliable result, additional information containing information about errors can be indicated.         For example, for information disclosure in minus this field contains detailed information on each position of the document,         leading to negative balances. \--\>              \<**xs:element** name\="additionalInfo" type\="xs:string" minOccurs\="0"/\>         \</**xs:sequence**\>     \</**xs:complexType**\> \</**xs:schema**\>  |

## Export of incoming invoice

| HTTP Method  | GET  |
| :---- | :---- |
| URI | **/documents/export/incomingInvoice** |
| Result  | XDS Incoming invoice |

### Parameters

| Code | Name Code | Comments |
| :---- | :---- | :---- |
| *from* | YYYY-MM-DD | start date |
| *to* | YYYY-MM-DD | end date |
| *supplierId* | GUID | Supplier ID  |

#### Request example

| http://localhost:9080/resto/api/documents/export/incomingInvoice?key=491eca76-beed-845e-878c-9b05c97be0e2\&from=2012-07-01\&to=2012-07-02\&supplierId=22A2A9D7-9D9C-48AD-BF99-83BF8CDE1938\&supplierId=C5C6F00D-E1E5-4E3C-A4B8-BB677F470572 |
| :---- |

Result 

| XML |
| :---- |
| \<incomingInvoiceDtoes\> 	\<document\>     	\<id\>575a43c7-85e0-4210-9c57-7a90efe37336\</id\>     	\<incomingDocumentNumber\>16594\</incomingDocumentNumber\>     	\<incomingDate\>2012-07-01T08:00:00\</incomingDate\>     	\<useDefaultDocumentTime\>false\</useDefaultDocumentTime\>     	\<dueDate\>2012-07-02T00:00:00\</dueDate\>     	\<supplier\>c5c6f00d-e1e5-4e3c-a4b8-bb677f470572\</supplier\>     	\<defaultStore\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</defaultStore\>     	\<invoice/\>     	\<documentNumber\>1568\</documentNumber\>     	\<comment\>Н\</comment\>     	\<status\>PROCESSED\</status\>     	\<items\>         	\<item\>             	\<actualAmount\>0.090000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00628\</code\>             	\<price\>420.440000000\</price\>             	\<sum\>37.840000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>9\</num\>             	\<product\>ddc8bb89-0892-45e5-b5d0-ce9cb3b25ff4\</product\>             	\<productArticle\>00628\</productArticle\>             	\<amount\>0.090000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>24.000000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00361\</code\>             	\<price\>50.700000000\</price\>             	\<sum\>1216.800000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>6\</num\>             	\<product\>c1ebbf72-0a69-4919-bfe1-2fe30058b0b0\</product\>             	\<productArticle\>00361\</productArticle\>             	\<amount\>24.000000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>3.200000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00632\</code\>             	\<price\>118.500000000\</price\>             	\<sum\>379.200000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>12\</num\>             	\<product\>0916900b-80d6-4a3b-8523-df020c5092d4\</product\>             	\<productArticle\>00632\</productArticle\>             	\<amount\>3.200000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>4.300000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00620\</code\>             	\<price\>43.900000000\</price\>             	\<sum\>188.770000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>14\</num\>             	\<product\>93d42251-0225-4f15-890e-91f24b0ea80e\</product\>             	\<productArticle\>00620\</productArticle\>             	\<amount\>4.300000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>1.180000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00225\</code\>             	\<price\>53.400000000\</price\>             	\<sum\>63.010000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>1\</num\>             	\<product\>cca71197-13ab-4a94-be43-84733ed988be\</product\>             	\<productArticle\>00225\</productArticle\>             	\<amount\>1.180000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>18.000000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00365\</code\>             	\<price\>34.900000000\</price\>             	\<sum\>628.200000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>7\</num\>             	\<product\>3e5df84d-4087-4a0e-9e11-2500d27c4c32\</product\>             	\<productArticle\>00365\</productArticle\>             	\<amount\>18.000000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>2.600000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00235\</code\>             	\<price\>141.300000000\</price\>             	\<sum\>367.380000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>2\</num\>             	\<product\>01eb23f7-0e23-4725-9cd9-563475202456\</product\>             	\<productArticle\>00235\</productArticle\>             	\<amount\>2.600000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>3.550000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00243\</code\>             	\<price\>70.000000000\</price\>             	\<sum\>248.500000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>8\</num\>             	\<product\>c6156fcb-f39e-4ab5-b5e3-76f4d9d72e87\</product\>             	\<productArticle\>00243\</productArticle\>             	\<amount\>3.550000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>1.590000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00629\</code\>             	\<price\>94.200000000\</price\>             	\<sum\>149.780000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>13\</num\>             	\<product\>f081b49b-4677-4a46-b650-2179d914f624\</product\>             	\<productArticle\>00629\</productArticle\>             	\<amount\>1.590000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>6.000000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00360\</code\>             	\<price\>49.700000000\</price\>             	\<sum\>298.200000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>5\</num\>             	\<product\>f170eec2-8bc1-42a1-b719-d9d22580f65b\</product\>             	\<productArticle\>00360\</productArticle\>             	\<amount\>6.000000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>1.850000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00233\</code\>             	\<price\>113.000000000\</price\>             	\<sum\>209.050000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>4\</num\>             	\<product\>178ff44a-29e0-41bc-896f-3caeeec9ca2d\</product\>             	\<productArticle\>00233\</productArticle\>             	\<amount\>1.850000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>0.400000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00236\</code\>             	\<price\>214.480000000\</price\>             	\<sum\>85.790000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>3\</num\>             	\<product\>ff8cfc27-bae1-40bf-8281-1d0c9ff0b0f5\</product\>             	\<productArticle\>00236\</productArticle\>             	\<amount\>0.400000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>0.440000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00625\</code\>             	\<price\>76.590000000\</price\>             	\<sum\>33.700000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>11\</num\>             	\<product\>4aefc3a1-7e99-480b-bfc5-7efd208d4fb6\</product\>             	\<productArticle\>00625\</productArticle\>             	\<amount\>0.440000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>0.850000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00242\</code\>             	\<price\>150.710000000\</price\>             	\<sum\>128.100000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>16\</num\>             	\<product\>780dc3b7-49d9-4d39-b227-a1a4c86e6cbd\</product\>             	\<productArticle\>00242\</productArticle\>             	\<amount\>0.850000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>0.680000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00251\</code\>             	\<price\>113.000000000\</price\>             	\<sum\>76.840000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>10\</num\>             	\<product\>887d28ba-02dd-4bcc-ae57-8102ff4e24e8\</product\>             	\<productArticle\>00251\</productArticle\>             	\<amount\>0.680000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>7.300000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00640\</code\>             	\<price\>48.600000000\</price\>             	\<sum\>354.780000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc\</amountUnit\>             	\<num\>15\</num\>             	\<product\>cb28aa64-6a21-44ec-8260-99505dbab2d1\</product\>             	\<productArticle\>00640\</productArticle\>             	\<amount\>7.300000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>15.000000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00280\</code\>             	\<price\>54.200000000\</price\>             	\<sum\>813.000000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>69859c74-db72-b006-cba5-326cf6f4fc6e\</amountUnit\>             	\<num\>17\</num\>             	\<product\>11a930a8-e281-4b65-959c-e93d89f5f9e9\</product\>             	\<productArticle\>00280\</productArticle\>             	\<amount\>15.000000000\</amount\>         	\</item\>     	\</items\> 	\</document\> 	\<document\>     	\<id\>df700f01-410b-4713-9b52-875f6c17faf5\</id\>     	\<incomingDocumentNumber\>56648\</incomingDocumentNumber\>     	\<incomingDate\>2012-07-01T08:00:00\</incomingDate\>     	\<useDefaultDocumentTime\>false\</useDefaultDocumentTime\>     	\<dueDate\>2012-07-02T00:00:00\</dueDate\>     	\<supplier\>22a2a9d7-9d9c-48ad-bf99-83bf8cde1938\</supplier\>     	\<defaultStore\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</defaultStore\>     	\<invoice/\>     	\<documentNumber\>1567\</documentNumber\>     	\<comment\>Н\</comment\>     	\<status\>PROCESSED\</status\>     	\<items\>         	\<item\>             	\<actualAmount\>152.000000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00136\</code\>             	\<price\>180.000000000\</price\>             	\<sum\>1440.000000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>69859c74-db72-b006-cba5-326cf6f4fc6e\</amountUnit\>             	\<containerId\>49882ad2-5db3-4a03-a096-96bc47238c5a\</containerId\>             	\<num\>1\</num\>             	\<product\>305936f8-a7ea-447c-b2f9-64e0eb3d3867\</product\>             	\<productArticle\>00136\</productArticle\>             	\<amount\>152.000000000\</amount\>         	\</item\>     	\</items\> 	\</document\> \</incomingInvoiceDtoes\> |

### [XSD of Incoming invoice](#xsd-incoming-invoice)

## Export of outgoing invoice

| HTTP Method  | GET  |
| :---- | :---- |
| URI | **/documents/export/outgoingInvoice**  |
| Result  | XDS outgoing invoice |

### Parameters

| Code | Name Code | Comments |
| :---- | :---- | :---- |
| *from* | YYYY-MM-DD | start date |
| *to* | YYYY-MM-DD | end date |
| *supplierId* | GUID | Supplier ID  |

#### Request example

| http://localhost:9080/resto/api/documents/export/outgoingInvoice?key=86024f97-3c65-08af-2798-d7817bcdadce\&from=2012-07-04\&to=2012-07-05\&supplierId=18761e00-aa16-4d0f-a064-d26cb3e7c646  |
| :---- |

Result 

| XML |
| :---- |
| \<outgoingInvoiceDtoes\> 	\<document\>     	\<id\>cde9adc2-1c49-4d68-9d30-31a3768df53e\</id\>     	\<documentNumber\>4\</documentNumber\>     	\<dateIncoming\>2012-07-04T23:00:00+04:00\</dateIncoming\>     	\<useDefaultDocumentTime\>false\</useDefaultDocumentTime\>     	\<status\>PROCESSED\</status\>     	\<accountToCode\>7.3\</accountToCode\>     	\<revenueAccountCode\>4.01.1\</revenueAccountCode\>     	\<defaultStoreId\>a80f6110-aa36-43ea-8fb7-de9b6a3a2346\</defaultStoreId\>     	\<defaultStoreCode\>16\</defaultStoreCode\>     	\<counteragentId\>18761e00-aa16-4d0f-a064-d26cb3e7c646\</counteragentId\>     	\<counteragentCode\>703\</counteragentCode\>     	\<comment/\>     	\<items\>         	\<item\>             	\<productId\>dc0c21ce-6ed9-4275-ae94-c6585ebd972a\</productId\>             	\<productArticle\>06062\</productArticle\>             	\<storeId\>a80f6110-aa36-43ea-8fb7-de9b6a3a2346\</storeId\>             	\<storeCode\>16\</storeCode\>             	\<price\>166.670000000\</price\>             	\<amount\>6.000000000\</amount\>             	\<sum\>1000.000000000\</sum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>         	\</item\>     	\</items\> 	\</document\> \</outgoingInvoiceDtoes\> |

### [XSD of Outgoing invoice](#xsd-outgoing-invoice)

## Incoming invoice export by number

| HTTP Method  | GET  |
| :---- | :---- |
| URI | **/ documents/export /incomingInvoice /byNumber** |
| Result  | XDS Incoming invoice |

### Parameters

| Code | Name Code | Comments |
| :---- | :---- | :---- |
| *number* | String  | document number |
| *from* | YYYY-MM-DD | start date |
| *to* | YYYY-MM-DD | end date |
| *currentYear* | Boolean | This is information for this year. This parameter is required . |

#### 

#### Request example

| http://localhost:9080/resto/api/documents/export/incomingInvoice/byNumber?key=49023c7b-86f4-351a-b237-554a674bf3a9\&number=1711\&from=2012-01-01\&to=2012-12-30\&currentYear=false  |
| :---- |

| XML |
| :---- |
| \<incomingInvoiceDtoes\> 	\<document\>     	\<id\>f12649c3-d340-4e61-9bbd-5ca2ac644636\</id\>     	\<incomingDocumentNumber\>1019\</incomingDocumentNumber\>     	\<incomingDate\>2012-07-14T08:00:00\</incomingDate\>     	\<useDefaultDocumentTime\>false\</useDefaultDocumentTime\>     	\<dueDate\>2012-07-15T00:00:00\</dueDate\>     	\<supplier\>e78e3868-1272-494e-80dc-190ec63a7fc1\</supplier\>     	\<defaultStore\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</defaultStore\>     	\<invoice/\>     	\<documentNumber\>1711\</documentNumber\>     	\<comment\>РЅ\</comment\>     	\<status\>PROCESSED\</status\>     	\<items\>         	\<item\>             	\<actualAmount\>1.000000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>07001\</code\>             	\<price\>500.000000000\</price\>             	\<sum\>500.000000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>cd19b5ea-1b32-a6e5-1df7-5d2784a0549a\</amountUnit\>             	\<num\>3\</num\>             	\<product\>28f786de-a835-42d5-9c18-84dd5de72e1c\</product\>             	\<productArticle\>07001\</productArticle\>             	\<amount\>1.000000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>30.000000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00103\</code\>             	\<price\>64.000000000\</price\>             	\<sum\>1920.000000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>69859c74-db72-b006-cba5-326cf6f4fc6e\</amountUnit\>             	\<num\>1\</num\>             	\<product\>f919d569-01c6-4593-a5cf-457a384b9165\</product\>             	\<productArticle\>00103\</productArticle\>             	\<amount\>30.000000000\</amount\>         	\</item\>         	\<item\>             	\<actualAmount\>30.000000000\</actualAmount\>             	\<store\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</store\>             	\<code\>00102\</code\>             	\<price\>69.000000000\</price\>             	\<sum\>2070.000000000\</sum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<amountUnit\>69859c74-db72-b006-cba5-326cf6f4fc6e\</amountUnit\>             	\<num\>2\</num\>             	\<product\>8f8b5673-0a54-49c8-8eac-f5f9c5edcb02\</product\>             	\<productArticle\>00102\</productArticle\>             	\<amount\>30.000000000\</amount\>         	\</item\>     	\</items\> 	\</document\> \</incomingInvoiceDtoes\> |

### [XSD of Incoming invoice](#xsd-incoming-invoice)

## Import of returned invoice

| HTTP Method  | POST |
| :---- | :---- |
| URI | / documents /import /returnedInvoice  |
| Header | Content-Type: application/xml  |
| Body  | *returnedInvoiceDto* structure |
| Result  | DocumentValidationResult structure |

#### Request example

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<document\>   \<documentNumber\>TAKT0003\</documentNumber\>   \<dateIncoming\>2016-05-03T00:12:35\</dateIncoming\>   \<status\>PROCESSED\</status\>   \<incomingInvoiceNumber\>TAKT0001\</incomingInvoiceNumber\>   \<incomingInvoiceDate\>2016-05-01\</incomingInvoiceDate\>   \<counteragentId\>4F1AC4B8-21AC-4FE6-8BEB-464EA10C5FFB\</counteragentId\>   \<items\> 	\<item\>   	\<storeId\>84A2C3D1-488B-42F4-96C1-4670F7D08583\</storeId\>   	\<productId\>FBCC2C7A-9B52-4FDB-8B95-4C9725273DE4\</productId\>   	\<price\>30\</price\>   	\<amount\>10\</amount\>   	\<sum\>300\</sum\>   	\<vatPercent\>12\</vatPercent\>   	\<vatSum\>32.20\</vatSum\> 	\</item\>   \</items\> \</document\>  |

#### Result

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<documentValidationResult\> 	\<valid\>false\</valid\> 	\<warning\>false\</warning\> 	\<documentNumber\>400234\</documentNumber\> 	\<errorMessage\>Cannot find document of type INCOMING\_INVOICE by number 'TAKT0001' and date '2016-05-01'\</errorMessage\> \</documentValidationResult\>  |

### XSD returned invoice

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="document" type="outgoingInvoiceDto"/\>   	\<xs:complexType name="outgoingInvoiceDto"\>     	\<xs:sequence\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="0"/\>         	\<\!--         	Date document in format:         	yyyy-MM-ddTHH:mm:ss, yyyy-MM-dd.         	\--\>          	\<xs:element name="dateIncoming" type="xs:dateTime" minOccurs="0"/\>         	\<\!--         	false(Value default is false ):Method uses date and time with dateIncoming.         	true: The method uses the settings of the documents they are in the group:          	\*Current time \- edit date and time with line dateIncoming;          	\* "Specified time" or "Shift closing time" \- edit date with dateIncoming, edit time with settings of the documents.         	\--\>         	\<xs:element name="useDefaultDocumentTime" type="xs:boolean" minOccurs="0" default="false"/\>         	\<xs:element name="status" type="documentStatus" minOccurs="0"/\>         	\<\!--External number and date document  \--\>         	\<xs:element name="incomingInvoiceNumber" type="xs:string" minOccurs="1"/\>         	\<xs:element name="incomingInvoiceDate" type="xs:dateTime" minOccurs="1"/\>         	\<\!--         	Cost accounting method:              true: write off at the purchase price of the goods,              false: record at observed (weighted moving average) cost.         	\--\>         	\<xs:element name="storeCostAffected" type="xs:string" minOccurs="0" default="false"/\>         	\<\!-- Account for write-off of goods (expenditure account). Value default is 5.01 ("Food consumption"). \--\>          	\<xs:element name="accountToCode" type="xs:string" minOccurs="0"/\>         	\<\!--         	Storee (id or code).If the invoice is posted this line is required".         	\--\>          	\<xs:element name="defaultStoreId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="defaultStoreCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Counteragent \--\>         	\<xs:element name="counteragentId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="counteragentCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Conception \--\>         	\<xs:element name="conceptionId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="conceptionCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Comment \--\>         	\<xs:element name="comment" type="xs:string" minOccurs="0"/\>         	\<xs:element name="items"\>             	\<xs:complexType\>                 	\<xs:sequence\>                     	\<xs:element name="item" type="outgoingInvoiceItemDto" minOccurs="0" maxOccurs="unbounded"/\>                 	\</xs:sequence\>             	\</xs:complexType\>         	\</xs:element\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:complexType name="outgoingInvoiceItemDto"\>     	\<xs:sequence\>         	\<\!-- Item element  (id or код SKU, required)--\>         	\<xs:element name="productId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="productArticle" type="xs:string" minOccurs="0"/\>         	\<\!-- Supplier product  (id or SKU, this is not required line). \--\>         	\<xs:element name="supplierProduct" type="xs:string" minOccurs="0"/\>         	\<xs:element name="supplierProductArticle" type="xs:string" minOccurs="0"/\>              \<xs:element name="customsDeclarationNumber" type="xs:string" minOccurs="0"/\>          	\<xs:element name="storeId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="storeCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Packing (id or SKU) \--\>         	\<xs:element name="containerId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="containerCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Price with VAT for packing without discount \--\>         	\<xs:element name="price" type="xs:decimal" minOccurs="1"/\>         	\<\!-- Quantity of a product in its basic units of measurement \--\>         	\<xs:element name="amount" type="xs:decimal" minOccurs="1"/\>         	\<\!--         	Line amount excluding discount.         	sum \== amount \* price / container \+ discountSum \+ vatSum          	\--\>         	\<xs:element name="sum" type="xs:decimal" minOccurs="1"/\>         	\<\!-- Discount summ \--\>         	\<xs:element name="discountSum" type="xs:decimal" minOccurs="0"/\>         	\<\!--         	The VAT percentage value and VAT amount for the document line.             If no amount is specified, it is calculated as a percentage.             If the percentage is not set, it is taken from the product card.             You cannot specify just the amount without specifying a percentage.          	\--\>         	\<xs:element name="vatPercent" type="xs:decimal" minOccurs="0"/\>         	\<xs:element name="vatSum" type="xs:decimal" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:simpleType name="documentStatus"\>     	\<xs:restriction base="xs:string"\>         	\<xs:enumeration value="NEW"/\>         	\<xs:enumeration value="PROCESSED"/\>         	\<xs:enumeration value="DELETED"/\>     	\</xs:restriction\> 	\</xs:simpleType\> \</xs:schema\> |

### 

### 

### XSD Validations result

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="documentValidationResult" type="documentValidationResult"/\>   	\<xs:complexType name="documentValidationResult"\>     	\<xs:sequence\>         	\<\!--Validations result\--\>         	\<xs:element name="valid" type="xs:boolean"/\>         	\<\!-- This is a warning that the error is not critical  \--\>         	\<xs:element name="warning" type="xs:boolean"/\>         	\<\!-- Number validations documents. \--\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="0"/\>         	\<\!-- New document number. The value is null if the old number isn\`t unique or the field has not   changed  \--\>         	\<xs:element name="otherSuggestedNumber" type="xs:string" minOccurs="0"/\>         	\<\!--This\`s error text--\>         	\<xs:element name="errorMessage" type="xs:string" minOccurs="0"/\>         	\<\!--  For an unreliable result, additional information containing information about errors can be indicated.         For example, for information disclosure in minus this field contains detailed information on each position of the document,         leading to negative balances. \--\>         	\<xs:element name="additionalInfo" type="xs:string" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\> |

## Export of outgoing invoice by number

| HTTP Method  | GET  |
| :---- | :---- |
| URI | **/ documents /export /outgoingInvoice /byNumber**  |
| Result  | XDS outgoing invoice |

### Parameters

| Code | Name Code | Comments |
| :---- | :---- | :---- |
| *number* | String  | document number |
| *from* | YYYY-MM-DD | start date |
| *to* | YYYY-MM-DD | end date |
| *currentYear* | Boolean | This is information for this year. This parameter is required . |

#### Request example

| http://localhost:9080/resto/api/documents/export/outgoingInvoice/byNumber?key=49023c7b-86f4-351a-b237-554a674bf3a9\&number=4\&from=2012-01-01\&to=2012-12-30\&currentYear=false |
| :---- |

| XML |
| :---- |
| \<outgoingInvoiceDtoes\> 	\<document\>     	\<id\>cde9adc2-1c49-4d68-9d30-31a3768df53e\</id\>     	\<documentNumber\>4\</documentNumber\>     	\<dateIncoming\>2012-07-04T23:00:00+04:00\</dateIncoming\>     	\<useDefaultDocumentTime\>false\</useDefaultDocumentTime\>     	\<status\>PROCESSED\</status\>     	\<accountToCode\>7.3\</accountToCode\>     	\<revenueAccountCode\>4.01.1\</revenueAccountCode\>     	\<defaultStoreId\>a80f6110-aa36-43ea-8fb7-de9b6a3a2346\</defaultStoreId\>     	\<defaultStoreCode\>16\</defaultStoreCode\>     	\<counteragentId\>18761e00-aa16-4d0f-a064-d26cb3e7c646\</counteragentId\>     	\<counteragentCode\>703\</counteragentCode\>     	\<comment/\>     	\<items\>         	\<item\>             	\<productId\>dc0c21ce-6ed9-4275-ae94-c6585ebd972a\</productId\>             	\<productArticle\>06062\</productArticle\>             	\<storeId\>a80f6110-aa36-43ea-8fb7-de9b6a3a2346\</storeId\>             	\<storeCode\>16\</storeCode\>             	\<price\>166.670000000\</price\>             	\<amount\>6.000000000\</amount\>             	\<sum\>1000.000000000\</sum\>             	\<discountSum\>0.000000000\</discountSum\>             	\<vatPercent\>0.000000000\</vatPercent\>             	\<vatSum\>0.000000000\</vatSum\>         	\</item\>     	\</items\> 	\</document\> \</outgoingInvoiceDtoes\> |

### [XSD of Outgoing invoice](#xsd-outgoing-invoice)

## Import cooking document

| HTTP Method  | POST |
| :---- | :---- |
| URI | / documents /import/productionDocument |
| Header | Content-Type: application/xml  |
| Body  | *productionDocumentDto*  structure |
| Result  | DocumentValidationResult structure |

#### Request example

| http://localhost:8080/resto/api/documents/import/productionDocument?key=d7474d4a-0a40-d918-85fa-2cd98fddfeb1  |
| :---- |

| XML |
| :---- |
| \<document\>   \<\!--This is guid Store--\>   \<storeFrom\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</storeFrom\>     \<\!--This is guid Store--\>   \<storeTo\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</storeTo\>    \<\!--Document date--\>   \<dateIncoming\>17.12.2014\</dateIncoming\>    \<\!--Document number-\>   \<documentNumber\>api-0002\</documentNumber\>    \<\!--Comment--\>   \<comment\>api test api-0002\</comment\>    \<items\>    	\<item\>       	\<\!--Packing(guid)--\>       	\<amountUnit\>cd19b5ea-1b32-a6e5-1df7-5d2784a0549a\</amountUnit\>        	\<\!--Container (guid)--\>       	\<containerId\>C66196B6-68F2-4C17-97C2-C2008A39A76A\</containerId\>          	\<\!--Serial number in the document--\>       	\<num\>1\</num\>       	\<\!--Product (guid)--\>       	\<product\>0f22aa60-e8ae-4c8e-80cd-f1e00b88fec6\</product\>       	\<\!--Quantity--\>     	\<amount\>1\</amount\>     	\</item\> 	\</items\>   \</document\> |

Result

| XML |
| :---- |
| HTTP/1.1 200 OK Server: Apache-Coyote/1.1 Vary: Accept-Encoding Content-Type: application/xml Content-Length: 192 Date: Wed, 17 Dec 2014 08:47:50 GMT \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\>\<documentValidationResult\>   \<documentNumber\>api-0002\</documentNumber\>   \<valid\>true\</valid\>   \<warning\>false\</warning\> \</documentValidationResult\> |

### XSD cooking document

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="document" type="productionDocumentDto"/\>   	\<xs:complexType name="productionDocumentDto"\>     	\<xs:sequence\>         	\<\!--Conception (guid)--\>         	\<xs:element name="conception" type="xs:string" minOccurs="0"/\>         	\<\!- Conception code \--\>         	\<xs:element name="conceptionCode" type="xs:string" minOccurs="0"/\>         	\<\!--Comment--\>         	\<xs:element name="comment" type="xs:string" minOccurs="0"/\>         	\<\!--Document number--\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="0"/\>         	\<\!--Date document in format :         	yyyy-MM-ddTHH:mm:ss, yyyy-MM-dd (dd.MM.yyyy не рекомендуется).         	\--\>         	\<xs:element name="dateIncoming" type="xs:string" minOccurs="0"/\>         	\<\!--Store  (guid)--\>         	\<xs:element name="storeTo" type="xs:string" minOccurs="0"/\>              	\<xs:element name="storeFrom" type="xs:string" minOccurs="0"/\>         	\<\!--Items--\>         	\<xs:element name="items" minOccurs="0"\>             	\<xs:complexType\>                 	\<xs:sequence\>                     	\<xs:element name="item" type="productionDocumentItemDto" minOccurs="0" maxOccurs="unbounded"/\>                 	\</xs:sequence\>             	\</xs:complexType\>         	\</xs:element\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:complexType name="productionDocumentItemDto"\>     	\<xs:sequence\>         	\<\!--Quantity of a product in its basic units of measurement--\>         	\<xs:element name="amount" type="xs:decimal" minOccurs="0"/\>         	\<\!--Product (guid)--\>         	\<xs:element name="product" type="xs:string" minOccurs="0"/\>         	\<\!--Product  (SKU). \--\>         	\<xs:element name="productArticle" type="xs:string" minOccurs="0"/\>         	\<\!--Serial number in the document--\>         	\<xs:element name="num" type="xs:int" minOccurs="0"/\>         	\<\!--Packing (guid)--\>         	\<xs:element name="containerId" type="xs:string" minOccurs="0"/\>         	\<\!--Base unit of measure(guid)--\>         	\<xs:element name="amountUnit" type="xs:string" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\> |

### XSD Validations result

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="documentValidationResult" type="documentValidationResult"/\>   	\<xs:complexType name="documentValidationResult"\>     	\<xs:sequence\>         	\<\!--Validations result\--\>         	\<xs:element name="valid" type="xs:boolean"/\>         	\<\!-- This is a warning that the error is not critical  \--\>         	\<xs:element name="warning" type="xs:boolean"/\>         	\<\!-- Number validations documents. \--\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="0"/\>         	\<\!-- New document number. The value is null if the old number isn\`t unique or the field has not   changed  \--\>         	\<xs:element name="otherSuggestedNumber" type="xs:string" minOccurs="0"/\>         	\<\!--This\`s error text--\>         	\<xs:element name="errorMessage" type="xs:string" minOccurs="0"/\>         	\<\!--  For an unreliable result, additional information containing information about errors can be indicated.         For example, for information disclosure in minus this field contains detailed information on each position of the document,         leading to negative balances. \--\>         	\<xs:element name="additionalInfo" type="xs:string" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\>  |

## Import sales document

| HTTP Method  | POST |
| :---- | :---- |
| URI | / documents /import /salesDocument  |
| Header | Content-Type: application/xml  |
| Body  | *productionDocumentDto*  structure |
| Result  | DocumentValidationResult structure |

#### Request example

| http://localhost:8080/resto/api/documents/import/salesDocument?key=d5e3186a-b5a9-edf7-5164-ca55e29fe5e1 |
| :---- |

| XML |
| :---- |
| \<document\>   \<items\> 	\<\!--Zero or more repetitions:--\>   	\<item\>           	\<discountSum\>11.00\</discountSum\>           	\<sum\>110.00\</sum\>           	\<amount\>3.00\</amount\>           	\<productId\>0f22aa60-e8ae-4c8e-80cd-f1e00b88fec6\</productId\>           	\<productArticle\>25753\</productArticle\>           	\<storeId\>1239D270-1BBE-F64F-B7EA-5F00518EF508\</storeId\>   	\</item\>   	\<item\>           	\<discountSum\>22.00\</discountSum\>           	\<sum\>220.00\</sum\>           	\<amount\>5.00\</amount\>           	\<productId\>b2d954ce-fc7a-44ff-9987-35af59f16966\</productId\>           	\<productArticle\>25752\</productArticle\>           	\<storeId\>153212ad-21af-4eeb-85c0-245822db3a70\</storeId\>   	\</item\>   \</items\>   \<status\>NEW\</status\>   \<accountToCode\>5.01\</accountToCode\>   \<revenueAccountCode\>4.01\</revenueAccountCode\>   \<documentNumber\>api-015\</documentNumber\>   \<dateIncoming\>17.12.2014\</dateIncoming\> \</document\>  |

Result

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<documentValidationResult\>   \<documentNumber\>api-015\</documentNumber\>   \<valid\>true\</valid\>   \<warning\>false\</warning\> \</documentValidationResult\>  |

### XSD Validations result

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="documentValidationResult" type="documentValidationResult"/\>   	\<xs:complexType name="documentValidationResult"\>     	\<xs:sequence\>         	\<\!--Validations result\--\>         	\<xs:element name="valid" type="xs:boolean"/\>         	\<\!-- This is a warning that the error is not critical  \--\>         	\<xs:element name="warning" type="xs:boolean"/\>         	\<\!-- Number validations documents. \--\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="0"/\>         	\<\!-- New document number. The value is null if the old number isn\`t unique or the field has not   changed  \--\>         	\<xs:element name="otherSuggestedNumber" type="xs:string" minOccurs="0"/\>         	\<\!--This\`s error text--\>         	\<xs:element name="errorMessage" type="xs:string" minOccurs="0"/\>         	\<\!--  For an unreliable result, additional information containing information about errors can be indicated.         For example, for information disclosure in minus this field contains detailed information on each position of the document,         leading to negative balances. \--\>         	\<xs:element name="additionalInfo" type="xs:string" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\>  |

### XSD sales document

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="document" type="salesDocumentDto"/\>   	\<xs:complexType name="salesDocumentDto"\>     	\<xs:sequence\>         	\<\!--Document status--\>         	\<xs:element name="status" type="documentStatus" minOccurs="0"/\>         	\<\!--Account for writing off goods (expenditure account). Default "Product consumption"--\>         	\<xs:element name="accountToCode" type="xs:string" minOccurs="0"/\>         	\<\!--Revenue account. The default is "Trading revenue excluding discounts"--\>         	\<xs:element name="revenueAccountCode" type="xs:string" minOccurs="0"/\>         	\<\!--Document number--\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="0"/\>         	\<\!-- Document date in format:         	yyyy-MM-ddTHH:mm:ss, yyyy-MM-dd         	\--\>         	\<xs:element name="dateIncoming" type="xs:string" minOccurs="0"/\>         	\<\!--Items--\>         	\<xs:element name="items" minOccurs="0"\>             	\<xs:complexType\>                 	\<xs:sequence\>                     	\<xs:element name="item" type="salesDocumentItemDto" minOccurs="0" maxOccurs="unbounded"/\>                 	\</xs:sequence\>             	\</xs:complexType\>         	\</xs:element\>     	\</xs:sequence\> 	\</xs:complexType\> 	\<xs:complexType name="salesDocumentItemDto"\>     	\<xs:sequence\>         	\<\!--Quantity of a product in its basic units of measurement--\>         	\<xs:element name="amount" type="xs:decimal" minOccurs="0"/\>         	\<\!--Store code--\>         	\<xs:element name="storeCode" type="xs:string" minOccurs="0"/\>         	\<xs:element name="storeId" type="xs:string" minOccurs="0"/\>         	\<\!--Product Id/SKU-\>         	\<xs:element name="productId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="productArticle" type="xs:string" minOccurs="0"/\>         	\<\!--         	Line amount excluding discount.         	sum \== amount \* price / container \+ discountSum \+ vatSum          	\--\>         	\<xs:element name="sum" type="xs:decimal" minOccurs="1"/\>         	\<\!-- Discount summ--\>         	\<xs:element name="discountSum" type="xs:decimal" minOccurs="0"/\>         	\<\!--         	The VAT percentage value and VAT amount for the document line.         If no amount is specified, it is calculated as a percentage.         If the percentage is not set, it is taken from the product card.         You cannot specify just the amount without specifying a percentage.          	\--\>         	\<xs:element name="vatPercent" type="xs:decimal" minOccurs="0"/\>         	\<xs:element name="vatSum" type="xs:decimal" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:simpleType name="documentStatus"\>     	\<xs:restriction base="xs:string"\>         	\<\!--New, not carried out--\>         	\<xs:enumeration value="NEW"/\>         	\<\!--Processed--\>         	\<xs:enumeration value="PROCESSED"/\>         	\<\!--Deleted--\>         	\<xs:enumeration value="DELETED"/\>     	\</xs:restriction\> 	\</xs:simpleType\> \</xs:schema\> |

## 

## Import incoming inventory

| HTTP Method  | POST |
| :---- | :---- |
| URI | / documents /import /incomingInventory  |
| Header | Content-Type: application/xml  |
| Body  | *incomingInventoryDto*  structure |
| Result  | *incomingInventoryValidationResult*  structure |

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8"?\> \<document\>   \<documentNumber\>Imv20160703j\</documentNumber\>   \<dateIncoming\>2016-07-03T00:24:00\</dateIncoming\>   \<status\>PROCESSED\</status\>   \<storeId\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</storeId\>   \<comment\>Nothing changed\</comment\>   \<items\> 	\<item\>   	\<productId\>F464E4D4-CF9C-49A2-9E18-1227B41A3801\</productId\>   	\<amountContainer\>5.0\</amountContainer\> 	\</item\> 	\<item\>   	\<productId\>C6D6C2F2-7E48-4AC9-84CA-1F566C3A941E\</productId\>   	\<containerId\>551E0382-64CA-49F1-B74F-733EBC6902C4\</containerId\>   	\<amountContainer\>18.0\</amountContainer\>   	\<comment\>Were there 19?\</comment\> 	\</item\> 	\<item\>   	\<productId\>C6D6C2F2-7E48-4AC9-84CA-1F566C3A941E\</productId\>   	\<containerId\>4D32F56F-89D4-4E2D-8912-3D3593A8284D\</containerId\>   	\<amountContainer\>28.0\</amountContainer\> 	\</item\> 	\<item\>   	\<productId\>C6D6C2F2-7E48-4AC9-84CA-1F566C3A941E\</productId\>   	\<amountContainer\>1.0\</amountContainer\> 	\</item\>   \</items\> \</document\> |

Result 

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes" ?\> \<incomingInventoryValidationResult\> 	\<valid\>true\</valid\> 	\<warning\>false\</warning\> 	\<documentNumber\>Imv20160703k\</documentNumber\> 	\<store\>     	\<id\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</id\>     	\<code\>1\</code\>     	\<name\>Main storage\</name\> 	\</store\> 	\<date\>2016-07-03T00:26:00+03:00\</date\> 	\<items\>     	\<item\>         	\<product\>             	\<id\>c6d6c2f2-7e48-4ac9-84ca-1f566c3a941e\</id\>             	\<code\>00001\</code\>             	\<name\>Product 1\</name\>         	\</product\>         	\<expectedAmount\>13.600000000\</expectedAmount\>         	\<expectedSum\>535.370000000\</expectedSum\>         	\<actualAmount\>29.450\</actualAmount\>         	\<differenceAmount\>15.850000000\</differenceAmount\>         	\<differenceSum\>623.930000000\</differenceSum\>     	\</item\>     	\<item\>         	\<product\>             	\<id\>f464e4d4-cf9c-49a2-9e18-1227b41a3801\</id\>             	\<code\>00002\</code\>             	\<name\>Product 2\</name\>         	\</product\>         	\<expectedAmount\>5.000000000\</expectedAmount\>         	\<expectedSum\>0\</expectedSum\>         	\<actualAmount\>4.000\</actualAmount\>         	\<differenceAmount\>1.000000000\</differenceAmount\>         	\<differenceSum\>0\</differenceSum\>     	\</item\> 	\</items\> \</incomingInventoryValidationResult\> |

### XSD inventory

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="document" type="incomingInventoryDto"/\>   	\<\!--Inventory--\> 	\<xs:complexType name="incomingInventoryDto"\>     	\<xs:sequence\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="0"/\>         	\<\!-- Document date in format:         	yyyy-MM-ddTHH:mm:ss, yyyy-MM-dd         	\--\>         	\<xs:element name="dateIncoming" type="xs:dateTime" minOccurs="0"/\>         	\<\!--         	false(Value default is false ):Method uses date and time with dateIncoming.         	true: The method uses the settings of the documents they are in the group:          	\*Current time \- edit date and time with line dateIncoming;          	\* "Specified time" or "Shift closing time" \- edit date with dateIncoming, edit time with               settings of the documents.         	\--\>          	\<xs:element name="useDefaultDocumentTime" type="xs:boolean" minOccurs="0" default="false"/\>         	\<\!-- NEW, PROCESSED, DELETED \--\>         	\<xs:element name="status" type="documentStatus" minOccurs="0"/\>         	\<\!-- The account in which the surplus was collected.  Default value is "5.10" ("Inventory surplus"). \--\>         	\<xs:element name="accountSurplusCode" type="xs:string" minOccurs="0"/\>         	\<\!-- The account to which it was taken.  Default value is "5.09" ("Inventory  shortage"). \--\>         	\<xs:element name="accountShortageCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Store (id or code). This value is required. \--\>         	\<xs:element name="storeId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="storeCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Conception \--\>         	\<xs:element name="conceptionId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="conceptionCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Comment by document \--\>         	\<xs:element name="comment" type="xs:string" minOccurs="0"/\>         	\<\!--             New lines for document.  You can import multiple rows for the same element, but their status must be the same.         	\--\>         	\<xs:element name="items"\>             	\<xs:complexType\>                 	\<xs:sequence\>                     	\<xs:element name="item" type="incomingInventoryItemDto" minOccurs="0" maxOccurs="unbounded"/\>                 	\</xs:sequence\>             	\</xs:complexType\>         	\</xs:element\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:complexType name="incomingInventoryItemDto"\>     	\<xs:sequence\>         	\<\!--         Line status.         	\--\>         	\<xs:element name="status" type="inventoryItemStatus" minOccurs="0"/\>         	\<\!--         	Ordinal number of recalculation of residues by item of the nomenclature.         Numbering from scratch. It gets worse on import.         	\--\>         	\<xs:element name="recalculationNumber" type="xs:integer" minOccurs="0"/\>         	\<\!-- Item (id or SKU) \--\>         	\<xs:element name="productId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="productArticle" type="xs:string" minOccurs="0"/\>         	\<\!-- Packing (id or SKU). \--\>         	\<xs:element name="containerId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="containerCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Количество в фасовках (containerId/containerCode).  \--\>         	\<xs:element name="amountContainer" type="xs:decimal" minOccurs="0"/\>         	\<\!-- Вес с тарой. Информационное поле, используется только для отображения в бекофисе. \--\>         	\<xs:element name="amountGross" type="xs:decimal" minOccurs="0"/\>         	\<\!--         	Производитель или импортер товара.         	Используется в российской алкогольной декларации.         	\--\>         	\<xs:element name="producerId" type="xs:string" minOccurs="0"/\>         	\<\!-- Произвольный комментарий к строке документа \--\>         	\<xs:element name="comment" type="xs:string" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:simpleType name="documentStatus"\>     	\<xs:restriction base="xs:string"\>         	\<xs:enumeration value="NEW"/\>         	\<xs:enumeration value="PROCESSED"/\>         	\<xs:enumeration value="DELETED"/\>     	\</xs:restriction\> 	\</xs:simpleType\>   	\<\!-- 	Статус строки инвентаризации. 	При импорте все строки, относящиеся к одному продукту, должны иметь одинаковый статус. 	Старые строки передавать со статусом RECALC не требуется. 	\--\> 	\<xs:simpleType name="inventoryItemStatus"\>     	\<xs:restriction base="xs:string"\>         	\<\!-- Строка не сохранена: проводки не создаются. \--\>         	\<xs:enumeration value="NEW"/\>         	\<\!-- Строка сохранена: проводки создаются. \--\>         	\<xs:enumeration value="SAVE"/\>         	\<\!-- Строка удалена (является результатом предыдущего подсчета). \--\>         	\<xs:enumeration value="RECALC"/\>     	\</xs:restriction\> 	\</xs:simpleType\> \</xs:schema\> |

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAACJUlEQVR4Xr2Wy08TYRTF+R9ckLhkxUICFcRHaABBJfIfEFFIxEdiNCZNGmUBIS5YuLC69JEQwlLZ+QKLYUHaNIpxAQsXLil1Omla+k699k6c+s25nW9mYWaSX27umXvPSTuPTAcRdQSNEIJACEEghCAQgh8q79/ezEcj3ysf3l3Hc34Qghf13a+j2aEzZFP7thvGGS+E4EVudrqohnKPM14IQUd5dWVZDbQpra0+wlkdQtBhXjwvAhnWcVaHEHRgmArO6hCCG9WtT1NWQPgsZU/3kxHqsarVN/Xq5/gU7rghhHYUnz5Zs3+R0XuC6l9SxAdX7u1zR89iK7jbDiEg9f29gezIUMvY6O2hemKH+ODKfetvHg0Tz6MHIgQkd2surV47bWiT3O0bafRAhKBSXn8dUQ39hDLl9TcR9FIRgk0jc9hpTl4Shn5CzckJamQyx9DTM7SwtBBHs1Zo8m9osn0oU1hajKOnNrSWTFxGk3+hyt2bSjruXoR90LttaOnl8xguO+Dn8lSIjO4uq9rPqRulVy9imCFCzbFhsejg3CCZExeo+HjZqtyLGQVzfIQwQ4TiEmL0Na/p9hYbWZV7nEEww9FUNj7O4gJiDJ6ko/ko/f51aFXucQapbm5cdQ3N37vzExcE9rt3IOR49+rI37/7wz30YTSFC/+DwvyDhGto4+DgOH8J5K5dqfpmZrpmgbpN06+RTne6hgaFEIJACEEghCD4A5KrTFD55yffAAAAAElFTkSuQmCC>