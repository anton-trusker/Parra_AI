# Documents

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

### XSD inventory {#xsd-inventory}

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="document" type="incomingInventoryDto"/\>   	\<\!--Inventory--\> 	\<xs:complexType name="incomingInventoryDto"\>     	\<xs:sequence\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="0"/\>         	\<\!-- Document date in format:         	yyyy-MM-ddTHH:mm:ss, yyyy-MM-dd         	\--\>         	\<xs:element name="dateIncoming" type="xs:dateTime" minOccurs="0"/\>         	\<\!--         	false(Value default is false ):Method uses date and time with dateIncoming.         	true: The method uses the settings of the documents they are in the group:          	\*Current time \- edit date and time with line dateIncoming;          	\* "Specified time" or "Shift closing time" \- edit date with dateIncoming, edit time with               settings of the documents.         	\--\>          	\<xs:element name="useDefaultDocumentTime" type="xs:boolean" minOccurs="0" default="false"/\>         	\<\!-- NEW, PROCESSED, DELETED \--\>         	\<xs:element name="status" type="documentStatus" minOccurs="0"/\>         	\<\!-- The account in which the surplus was collected.  Default value is "5.10" ("Inventory surplus"). \--\>         	\<xs:element name="accountSurplusCode" type="xs:string" minOccurs="0"/\>         	\<\!-- The account to which it was taken.  Default value is "5.09" ("Inventory  shortage"). \--\>         	\<xs:element name="accountShortageCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Store (id or code). This value is required. \--\>         	\<xs:element name="storeId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="storeCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Conception \--\>         	\<xs:element name="conceptionId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="conceptionCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Comment by document \--\>         	\<xs:element name="comment" type="xs:string" minOccurs="0"/\>         	\<\!--             New lines for document.  You can import multiple rows for the same element, but their status must be the same.         	\--\>         	\<xs:element name="items"\>             	\<xs:complexType\>                 	\<xs:sequence\>                     	\<xs:element name="item" type="incomingInventoryItemDto" minOccurs="0" maxOccurs="unbounded"/\>                 	\</xs:sequence\>             	\</xs:complexType\>         	\</xs:element\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:complexType name="incomingInventoryItemDto"\>     	\<xs:sequence\>         	\<\!--         Line status.         	\--\>         	\<xs:element name="status" type="inventoryItemStatus" minOccurs="0"/\>         	\<\!--         	Ordinal number of recalculation of residues by item of the nomenclature.         Numbering from scratch. It gets worse on import.         	\--\>         	\<xs:element name="recalculationNumber" type="xs:integer" minOccurs="0"/\>         	\<\!-- Item (id or SKU) \--\>         	\<xs:element name="productId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="productArticle" type="xs:string" minOccurs="0"/\>         	\<\!-- Packing (id or SKU). \--\>         	\<xs:element name="containerId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="containerCode" type="xs:string" minOccurs="0"/\>         	\<\!-- Quantity in packages  \--\>         	\<xs:element name="amountContainer" type="xs:decimal" minOccurs="0"/\>         	\<\!-- Weight with container. Information field, used only for display in the back office. \--\>         	\<xs:element name="amountGross" type="xs:decimal" minOccurs="0"/\>                 	\<xs:element name="producerId" type="xs:string" minOccurs="0"/\>         	\<\!-- Comment \--\>         	\<xs:element name="comment" type="xs:string" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:simpleType name="documentStatus"\>     	\<xs:restriction base="xs:string"\>         	\<xs:enumeration value="NEW"/\>         	\<xs:enumeration value="PROCESSED"/\>         	\<xs:enumeration value="DELETED"/\>     	\</xs:restriction\> 	\</xs:simpleType\>   	\<\!--Status--\> 	\<xs:simpleType name="inventoryItemStatus"\>     	\<xs:restriction base="xs:string"\>        	         	\<xs:enumeration value="NEW"/\>       	         	\<xs:enumeration value="SAVE"/\>        	         	\<xs:enumeration value="RECALC"/\>     	\</xs:restriction\> 	\</xs:simpleType\> \</xs:schema\> |

### 

### XSD Validations result

### 

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="document" type="incomingInventoryValidationResultDto"/\>  	\<xs:complexType name="incomingInventoryValidationResultDto"\>     	\<xs:sequence\>         	\<\!--Validations result\--\>         	\<xs:element name="valid" type="xs:boolean" minOccurs="1"/\>         	\<xs:element name="warning" type="xs:boolean" minOccurs="0" default="false"/\>         	\<\!--Document number. \--\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="1"/\>         	\<\!-- New document number. The value is null if the old number isn\`t unique or the field has not   changed  \--\>         	\<xs:element name="otherSuggestedNumber" type="xs:string" minOccurs="1"/\>         	\<\!--This\`s error text--\>         	\<xs:element name="errorMessage" type="xs:string" minOccurs="0"/\>            	\<xs:element name="additionalInfo" type="xs:string" minOccurs="0"/\>           	\<\!-- Inventory-specific properties.Filled only when requesting an inventory result--\>         	\<\!-- Store \--\>         	\<xs:element name="store" type="idCodeNameDto" minOccurs="0"/\>         	\<\!-- Accounting date-time of the inventory. \--\>         	\<xs:element name="date" type="xs:dateTime" minOccurs="0"/\>         	\<\!-- Items \--\>         	\<xs:element name="items"\>             	\<xs:complexType\>                 	\<xs:sequence\>                     	\<xs:element name="item" type="incomingInventoryValidationResultItemDto"                                 	minOccurs="0" maxOccurs="unbounded"/\>                 	\</xs:sequence\>             	\</xs:complexType\>         	\</xs:element\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:complexType name="incomingInventoryValidationResultItemDto"\>     	\<xs:sequence\>         	\<xs:element name="product" type="idCodeNameDto" minOccurs="1"/\>         	\<\!--Estimated quantity of goods.May have higher precision than allowed in documents (9 instead of 3 decimal places).--\>         	\<xs:element name="expectedAmount" type="xs:decimal" minOccurs="1"/\>         	\<\!--Estimated amount of goods. Strictly two decimal places--\>         	\<xs:element name="expectedSum" type="xs:decimal" minOccurs="1"/\>         	\<\!-- The actual quantity in the item's base unit of measure.         	The sum of all conducted (SAVE) inventory lines for this product, taking into account packaging and rounding rules for document strings         	\--\>         	\<xs:element name="actualAmount" type="xs:decimal" minOccurs="1"/\>         	\<\!--         	The amount of surplus (+) or shortage (-) in the base unit of measurement of the good.         Filled in only for the completed inventory, for unposted documents 0\. \--\>         	\<xs:element name="differenceAmount" type="xs:decimal" minOccurs="1"/\>         	\<\!--         	The amount of surplus or shortage of the conducted inventory (0 for unposted documents).         The sign may not coincide with the sign of the quantity in case of a negative cost         due to return labels on the purchase price.         	\--\>         	\<xs:element name="differenceSum" type="xs:decimal" minOccurs="1"/\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:complexType name="idCodeNameDto"\>     	\<xs:sequence\>         	\<\!-- Internal UUID of the object. Does not change, unique within the server. \--\>         	\<xs:element name="id" type="xs:string" minOccurs="1"/\>         	\<\!-- SKU--\>         	\<xs:element name="code" type="xs:string" minOccurs="0"/\>         	\<\!--Name.--\>         	\<xs:element name="name" type="xs:string" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\> |
|  |

## Obtain inventory results before inventory

| HTTP Method  | POST |
| :---- | :---- |
| URI | / documents /check /incomingInventory   |
| Header | Content-Type: application/xml  |
| Body  | *incomingInventoryDto* structure |
| Result  | *incomingInventoryValidationResult*  structure |

### Request example

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8"?\> \<document\>   \<documentNumber\>Imv20160703j\</documentNumber\>   \<dateIncoming\>2016-07-03T00:24:00\</dateIncoming\>   \<status\>PROCESSED\</status\>   \<storeId\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</storeId\>   \<comment\>Comment\</comment\>   \<items\> 	\<item\>   	\<productId\>F464E4D4-CF9C-49A2-9E18-1227B41A3801\</productId\>   	\<amountContainer\>5.0\</amountContainer\> 	\</item\> 	\<item\>   	\<productId\>C6D6C2F2-7E48-4AC9-84CA-1F566C3A941E\</productId\>   	\<containerId\>551E0382-64CA-49F1-B74F-733EBC6902C4\</containerId\>   	\<amountContainer\>18.0\</amountContainer\>   	\<comment\>Were there 19?\</comment\> 	\</item\> 	\<item\>   	\<productId\>C6D6C2F2-7E48-4AC9-84CA-1F566C3A941E\</productId\>   	\<containerId\>4D32F56F-89D4-4E2D-8912-3D3593A8284D\</containerId\>   	\<amountContainer\>28.0\</amountContainer\> 	\</item\> 	\<item\>   	\<productId\>C6D6C2F2-7E48-4AC9-84CA-1F566C3A941E\</productId\>   	\<amountContainer\>1.0\</amountContainer\> 	\</item\>   \</items\> \</document\> |

Result

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes" ?\> \<incomingInventoryValidationResult\> 	\<valid\>true\</valid\> 	\<warning\>false\</warning\> 	\<documentNumber\>Imv20160703k\</documentNumber\> 	\<store\>     	\<id\>1239d270-1bbe-f64f-b7ea-5f00518ef508\</id\>     	\<code\>1\</code\>     	\<name\>Main storage\</name\> 	\</store\> 	\<date\>2016-07-03T00:26:00+03:00\</date\> 	\<items\>     	\<item\>         	\<product\>             	\<id\>c6d6c2f2-7e48-4ac9-84ca-1f566c3a941e\</id\>             	\<code\>00001\</code\>             	\<name\>Product 1name\>         	\</product\>         	\<expectedAmount\>13.600000000\</expectedAmount\>         	\<expectedSum\>535.370000000\</expectedSum\>         	\<actualAmount\>29.450\</actualAmount\>         	\<differenceAmount\>15.850000000\</differenceAmount\>         	\<differenceSum\>623.930000000\</differenceSum\>     	\</item\>     	\<item\>         	\<product\>             	\<id\>f464e4d4-cf9c-49a2-9e18-1227b41a3801\</id\>             	\<code\>00002\</code\>             	\<name\>Product 2\</name\>         	\</product\>         	\<expectedAmount\>5.000000000\</expectedAmount\>         	\<expectedSum\>0\</expectedSum\>         	\<actualAmount\>4.000\</actualAmount\>         	\<differenceAmount\>1.000000000\</differenceAmount\>         	\<differenceSum\>0\</differenceSum\>     	\</item\> 	\</items\> \</incomingInventoryValidationResult\> |

### XSD Validations result

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> 	\<xs:element name="document" type="incomingInventoryValidationResultDto"/\> 	\<xs:complexType name="incomingInventoryValidationResultDto"\>     	\<xs:sequence\>         	\<\!-- Validations result. \--\>         	\<xs:element name="valid" type="xs:boolean" minOccurs="1"/\>         	\<xs:element name="warning" type="xs:boolean" minOccurs="0" default="false"/\>         	\<\!-- Document number--\>         	\<xs:element name="documentNumber" type="xs:string" minOccurs="1"/\>            \<\!-- Number validations documents. \--\>         	\<xs:element name="otherSuggestedNumber" type="xs:string" minOccurs="1"/\>         	\<\!--This\`s error text--\>         	\<xs:element name="errorMessage" type="xs:string" minOccurs="0"/\>         	\<xs:element name="additionalInfo" type="xs:string" minOccurs="0"/\>           	\<\!-- Inventory-specific properties.Filled only when requesting an inventory result--\>         	\<\!-- Store \--\>         	\<xs:element name="store" type="idCodeNameDto" minOccurs="0"/\>         	\<\!-- Accounting date-time of the inventory--\>         	\<xs:element name="date" type="xs:dateTime" minOccurs="0"/\>         	\<\!--Lines \--\>         	\<xs:element name="items"\>             	\<xs:complexType\>                 	\<xs:sequence\>                     	\<xs:element name="item" type="incomingInventoryValidationResultItemDto"                                 	minOccurs="0" maxOccurs="unbounded"/\>                 	\</xs:sequence\>             	\</xs:complexType\>         	\</xs:element\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:complexType name="incomingInventoryValidationResultItemDto"\>     	\<xs:sequence\>         	\<xs:element name="product" type="idCodeNameDto" minOccurs="1"/\>         	\<\!--Estimated quantity of goods.May have higher precision than allowed in documents (9 instead of 3 decimal places).--\>         	\<xs:element name="expectedAmount" type="xs:decimal" minOccurs="1"/\>         	\<\!--Estimated amount of goods. Strictly two decimal places--\>         	\<xs:element name="expectedSum" type="xs:decimal" minOccurs="1"/\>         	\<\!-- The actual quantity in the item's base unit of measure.         	The sum of all conducted (SAVE) inventory lines for this product, taking into account packaging and rounding rules for document strings         	\--\>         	\<xs:element name="actualAmount" type="xs:decimal" minOccurs="1"/\>         	\<\!--         	The amount of surplus (+) or shortage (-) in the base unit of measurement of the good.         Filled in only for the completed inventory, for unposted documents 0\. \--\>         	\<xs:element name="differenceAmount" type="xs:decimal" minOccurs="1"/\>         	\<\!--         	The amount of surplus or shortage of the conducted inventory (0 for unposted documents).         The sign may not coincide with the sign of the quantity in case of a negative cost         due to return labels on the purchase price.         	\--\>         	\<xs:element name="differenceSum" type="xs:decimal" minOccurs="1"/\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:complexType name="idCodeNameDto"\>     	\<xs:sequence\>         		\<\!-- Internal UUID of the object. Does not change, unique within the server. \--\>         	\<xs:element name="id" type="xs:string" minOccurs="1"/\>         	\<\!-- SKU--\>          	\<xs:element name="code" type="xs:string" minOccurs="0"/\>         	\<\!--Name.--\>         	\<xs:element name="name" type="xs:string" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\> |

### [XSD inventory](#xsd-inventory)

## Write-off acts

### Description of fields

### **WriteoffDocumentDto**

| Code | Name Code | Comments |
| :---- | :---- | :---- |
| id | UUID | This\`s id element |
| dateIncoming | String | This\`s date incoming document in format "yyyy-MM-dd'T'HH:mm". |
| documentNumber | String | This\`s document number |
| status | Enum |  Code Name Code NEW This\`s new document PROCESSED Status document is processed DELETED Document\`s deleted   |
| conceptionId | UUID | Thi\`s conception id |
| comment | String | Document comment |
| storeId | UUID | This\`s store id |
| accountId | UUID | Identifier of the account to which the cost of the goods will be debited. |
| externalOutgoingInvoiceId | UUID | Invoice ID from externalStore, if there is a write-off from a warehouse with the "Write-off from external warehouse" option checked. |
| externalProductionDocumentId | UUID | Identifier of the preparation act, if a preparation act was generated when posting this document. |
| items | List\<WriteoffDocumentItemDto\> | Items |

### 

### **WriteoffDocumentItemDto**

### 

| Code | Name Code | Comments |
| :---- | :---- | :---- |
| **num** | Integer | Number line |
| **productId** | UUID | Product id |
| **productSizeId** | UUID | Product size Id |
| **amountFactor** | BigDecimal | Product amount factor |
| **amount** | BigDecimal | Product quantity in product units. |
| **measureUnitId** | UUID | Units of measurement of the product at the time of decommissioning. |
| **containerId** | UUID | Product packaging identifier. |
| **cost** | BigDecimal | The cost price for a given quantity of a product. Only reading.  |

### 

### Import write-off acts

| HTTP Method  | GET |
| :---- | :---- |
| URI | **/documents/writeoff** |
| Parameters |  Code Name Code Comments dateFrom String Parameter is required. Format "yyyy-MM-dd". dateTo String Parameter is required. Format "yyyy-MM-dd". status Enum Status document revisionFrom Integer  |
| Result | List document.  |

##### Request example

| [http://localhost:9080/resto/api/v2/documents/writeoff?dateFrom=2018-01-01\&dateTo=2021-12-31](http://localhost:9080/resto/api/v2/documents/writeoff?dateFrom=2018-01-01&dateTo=2021-12-31) |
| :---- |

| JSON |
| :---- |
| {     "result": "SUCCESS",     "errors": \[\],     "response": \[         {             "id": "3d27d640-d6a1-4545-86a4-b07422c3c9f0",             "dateIncoming": "2020-01-10T23:00",             "documentNumber": "20002",             "status": "PROCESSED",             "storeId": "7954d76d-6177-402c-ba2a-cc0ff16486fa",             "accountId": "97036ddb-b2e1-cd47-1669-c145daa9f9c5",             "items": \[                 {                     "num": 1,                     "productId": "31e6155c-e842-448f-8266-1d05eb8e977a",                     "productSizeId": null,                     "amountFactor": 1,                     "amount": 2,                     "measureUnitId": "6040d92d-e286-f4f9-a613-ed0e6fd241e1",                     "containerId": null,                     "cost": 0                 }             \]         },         {             "id": "0173e58c-7bcd-487d-a8ad-c8ec48c642a1",             "dateIncoming": "2020-01-14T23:00",             "documentNumber": "20001",             "status": "PROCESSED",             "storeId": "7954d76d-6177-402c-ba2a-cc0ff16486fa",             "accountId": "8c46f55a-0698-4e3f-8703-8bb36b24e8ac",             "items": \[                 {                     "num": 1,                     "productId": "50cedffc-04e9-aa79-016b-d1f9c56122e8",                     "productSizeId": null,                     "amountFactor": 1,                     "amount": 2,                     "measureUnitId": "7ba81c3a-8de5-8f9d-fb9f-e39efcbc57cc",                     "containerId": null,                     "cost": 200                 }             \]         }     \],     "revision": 244610 } |

### Export write-off acts by id

| HTTP Method  | GET |
| :---- | :---- |
| URI | **/documents/writeoff/byId** |
| Parameters |  Code Name Code Comments **id** UUID This i id document   |

##### Request example

| [http://localhost:9080/resto/api/v2/documents/writeoff/byId?id=3d27d640-d6a1-4545-86a4-b07422c3c9f0](http://localhost:9080/resto/api/v2/documents/writeoff/byId?id=3d27d640-d6a1-4545-86a4-b07422c3c9f0) |
| :---- |

| JSON |
| :---- |
| {     "id": "3d27d640-d6a1-4545-86a4-b07422c3c9f0",     "dateIncoming": "2020-01-10T23:00",     "documentNumber": "20002",     "status": "PROCESSED",     "storeId": "7954d76d-6177-402c-ba2a-cc0ff16486fa",     "accountId": "97036ddb-b2e1-cd47-1669-c145daa9f9c5",     "items": \[         {             "num": 1,             "productId": "31e6155c-e842-448f-8266-1d05eb8e977a",             "productSizeId": **null**,             "amountFactor": 1,             "amount": 2,             "measureUnitId": "6040d92d-e286-f4f9-a613-ed0e6fd241e1",             "containerId": **null**,             "cost": 0         }     \] } |

### Export write-off acts by number

| HTTP Method  | GET |
| :---- | :---- |
| URI | **/documents/writeoff/byNumber** |
| Parameters |  Code Name Code Comments **documentNumber** String Document number  |

##### Request example

| [http://localhost:9080/resto/api/v2/documents/writeoff/byNumber?documentNumber=20002](http://localhost:9080/resto/api/v2/documents/writeoff/byNumber?documentNumber=20002) |
| :---- |

| JSON |
| :---- |
| {     "id": "3d27d640-d6a1-4545-86a4-b07422c3c9f0",     "dateIncoming": "2020-01-10T23:00",     "documentNumber": "20002",     "status": "PROCESSED",     "storeId": "7954d76d-6177-402c-ba2a-cc0ff16486fa",     "accountId": "97036ddb-b2e1-cd47-1669-c145daa9f9c5",     "items": \[         {             "num": 1,             "productId": "31e6155c-e842-448f-8266-1d05eb8e977a",             "productSizeId": **null**,             "amountFactor": 1,             "amount": 2,             "measureUnitId": "6040d92d-e286-f4f9-a613-ed0e6fd241e1",             "containerId": **null**,             "cost": 0         }     \] } |

### Creating/editing  document

| HTTP Method  | POST |
| :---- | :---- |
| URI | **/documents/writeoff** |
| Body | Lines 'dateIncoming', 'status', 'storeId', 'accountId','productId', 'amount' are required Request example JSON {     "dateIncoming": "2021-11-16T23:00",     "status": "NEW",     "comment": "yyy",     "storeId": "7954d76d-6177-402c-ba2a-cc0ff16486fa",     "accountId": "8c46f55a-0698-4e3f-8703-8bb36b24e8ac",     "items": \[         {             "productId": "50cedffc-04e9-aa79-016b-d1f9c56122e8",             "amount": 1         }     \] }  |
| Result |  [http://localhost:9080/resto/api/v2](http://localhost:9080/resto/api/v2/documents/writeoff/byNumber?documentNumber=20002)/documents/writeoff  JSON {     "result": "SUCCESS",     "errors": \[\],     "response": {         "id": "78e58a66-1648-e023-017d-28c01da501cc",         "dateIncoming": "2021-11-16T23:00",         "documentNumber": "",         "status": "NEW",         "comment": "yyy",         "storeId": "7954d76d-6177-402c-ba2a-cc0ff16486fa",         "accountId": "8c46f55a-0698-4e3f-8703-8bb36b24e8ac",         "items": \[             {                 "num": 1,                 "productId": "50cedffc-04e9-aa79-016b-d1f9c56122e8",                 "productSizeId": **null**,                 "amountFactor": 1,                 "amount": 1,                 "measureUnitId": "6040d92d-e286-f4f9-a613-ed0e6fd241e1",                 "containerId": **null**,                 "cost": **null**             }         \]     }   |

## Internal movements

### **InternalTransferDto**

| Code | Name Code | Comments |
| :---- | :---- | :---- |
| **id** | **UUID** | Document id |
| **dateIncoming** | **String** | Document date incoming "yyyy-MM-dd'T'HH:mm"  |
| **documentNumber** | **String** | Document number |
| **status** | **Enum** | **Document status Code  Comments NEW** This is new document **PROCESSED** This is processed status **DELETED** This is document deleted   |
| **conceptionId** | **UUID** | Conception  |
| **comment** | **String** | Comment |
| **storeFromId** | **UUID** | Identifier of the warehouse from which the movement takes place. |
| **storeToId** | **UUID** | The identifier of the warehouse to which the movement is taking place. |
| **items** | **List\<InternalTransferItemDto\>** | Item |

### **InternalTransferItemDto**

| Code | Name Code | Comments |
| :---- | :---- | :---- |
| **num** | **Integer** | Number document line |
| **productId** | **UUID** | Product ID |
| **amount** | **BigDecimal** | Amount |
| **measureUnitId** | **UUID** | Units of measurement of the product at the time of decommissioning. Only reading. |
| **containerId** | **UUID** | Container ID |
| **cost** | **BigDecimal** | Cost  |

### Export document 

| HTTP Method  | GET |
| :---- | :---- |
| URI | **/documents/internalTransfer** |
| Body |  Code Name Code Comments dateFrom String The beginning of the time interval in the format "yyyy-mm-dd". \* Required dateTo String End of time interval in "yyyy-MM-dd" format. \*Required status Enum Document status. revisionFrom Integer  |
| Result | List document |

##### Request example

| [http://localhost:9080/resto/api/v2/documents/internalTransfer?dateFrom=2018-01-01\&dateTo=2021-12-31](http://localhost:9080/resto/api/v2/documents/internalTransfer?dateFrom=2018-01-01&dateTo=2021-12-31) |
| :---- |

| JSON |
| :---- |
| {     "result": "SUCCESS",     "errors": \[\],     "response": \[         {             "id": "f26f9661-c1c1-437e-b68a-e67cd78cc1a0",             "dateIncoming": "2021-04-01T12:08:36.340",             "documentNumber": "20002",             "status": "NEW",             "storeFromId": "7954d76d-6177-402c-ba2a-cc0ff16486fa",             "storeToId": "cfdfaff0-382c-4851-bba2-92b408db02ef",             "items": \[                 {                     "num": 1,                     "productId": "ccdada6c-1643-4c52-9e09-752a4de117a0",                     "amount": 20,                     "measureUnitId": "cd19b5ea-1b32-a6e5-1df7-5d2784a0549a",                     "containerId": "e2e67737-18bf-437b-8230-8ec17da75096",                     "cost": **null**                 }             \]         },         {             "id": "925482f9-49fa-4afe-810c-b3e22d4793de",             "dateIncoming": "2021-11-08T13:31:20.737",             "documentNumber": "20001",             "status": "NEW",             "storeFromId": "7954d76d-6177-402c-ba2a-cc0ff16486fa",             "storeToId": "cfdfaff0-382c-4851-bba2-92b408db02ef",             "items": \[                 {                     "num": 1,                     "productId": "50cedffc-04e9-aa79-016b-d1f9c56122e8",                     "amount": 1,                     "measureUnitId": "6040d92d-e286-f4f9-a613-ed0e6fd241e1",                     "containerId": **null**,                     "cost": **null**                 }             \]         },         {             "id": "0fd6f4ad-4858-401c-017d-22eacb7101a7",             "dateIncoming": "2021-11-15T06:00",             "documentNumber": "30002",             "status": "NEW",             "comment": "zzz",             "storeFromId": "05a407d4-d7c6-4bc2-a578-6ad5de99d468",             "storeToId": "370620fe-c789-46db-9d92-33bec29b82a3",             "items": \[                 {                     "num": 1,                     "productId": "ccdada6c-1643-4c52-9e09-752a4de117a0",                     "amount": 5,                     "measureUnitId": "cd19b5ea-1b32-a6e5-1df7-5d2784a0549a",                     "containerId": "e2e67737-18bf-437b-8230-8ec17da75096",                     "cost": **null**                 },                 {                     "num": 2,                     "productId": "8972b757-4e08-4c50-a145-80cd12bb4f1e",                     "amount": 5,                     "measureUnitId": "cd19b5ea-1b32-a6e5-1df7-5d2784a0549a",                     "containerId": "84d13550-d3c8-4f73-8e35-2ae470260bdc",                     "cost": **null**                 }             \]         },         {             "id": "ad6fdddd-e6c2-29fb-016c-38c884f75d8d",             "dateIncoming": "2019-07-30T06:00",             "documentNumber": "30001",             "status": "PROCESSED",             "comment": "Сформирован на основании заказа №0001",             "storeFromId": "05a407d4-d7c6-4bc2-a578-6ad5de99d468",             "storeToId": "370620fe-c789-46db-9d92-33bec29b82a3",             "items": \[                 {                     "num": 1,                     "productId": "ccdada6c-1643-4c52-9e09-752a4de117a0",                     "amount": 50,                     "measureUnitId": "cd19b5ea-1b32-a6e5-1df7-5d2784a0549a",                     "containerId": "e2e67737-18bf-437b-8230-8ec17da75096",                     "cost": 0                 },                 {                     "num": 2,                     "productId": "8972b757-4e08-4c50-a145-80cd12bb4f1e",                     "amount": 50,                     "measureUnitId": "cd19b5ea-1b32-a6e5-1df7-5d2784a0549a",                     "containerId": "84d13550-d3c8-4f73-8e35-2ae470260bdc",                     "cost": 0                 }             \]         }     \],     "revision": 244615 }  |

### Export document by id

| HTTP Method  | GET |
| :---- | :---- |
| URI | **/documents/internalTransfer/byId** |
| Parameters |  Code Name Code Comments id UUID Document ID  |

| [http://localhost:9080/resto/api/v2/documents/internalTransfer/byId?id=f26f9661-c1c1-437e-b68a-e67cd78cc1a0](http://localhost:9080/resto/api/v2/documents/internalTransfer/byId?id=f26f9661-c1c1-437e-b68a-e67cd78cc1a0) |
| :---- |

| JSON |
| :---- |
| {     "id": "f26f9661-c1c1-437e-b68a-e67cd78cc1a0",     "dateIncoming": "2021-04-01T12:08:36.340",     "documentNumber": "20002",     "status": "NEW",     "storeFromId": "7954d76d-6177-402c-ba2a-cc0ff16486fa",     "storeToId": "cfdfaff0-382c-4851-bba2-92b408db02ef",     "items": \[         {             "num": 1,             "productId": "ccdada6c-1643-4c52-9e09-752a4de117a0",             "amount": 20,             "measureUnitId": "cd19b5ea-1b32-a6e5-1df7-5d2784a0549a",             "containerId": "e2e67737-18bf-437b-8230-8ec17da75096",             "cost": **null**         }     \] }  |

### Export document by number

| HTTP Method  | GET |
| :---- | :---- |
| URI | **/documents/internalTransfer/byNumber** |
| Parameters |  Code Name Code Comments **documentNumber** String Document number  |

##### Request example

| [http://localhost:9080/resto/api/v2/documents/internalTransfer/byNumber?documentNumber=20002](http://localhost:9080/resto/api/v2/documents/internalTransfer/byNumber?documentNumber=20002) |
| :---- |

| JSON |
| :---- |
| \[     {         "id": "f26f9661-c1c1-437e-b68a-e67cd78cc1a0",         "dateIncoming": "2021-04-01T12:08:36.340",         "documentNumber": "20002",         "status": "NEW",         "storeFromId": "7954d76d-6177-402c-ba2a-cc0ff16486fa",         "storeToId": "cfdfaff0-382c-4851-bba2-92b408db02ef",         "items": \[             {                 "num": 1,                 "productId": "ccdada6c-1643-4c52-9e09-752a4de117a0",                 "amount": 20,                 "measureUnitId": "cd19b5ea-1b32-a6e5-1df7-5d2784a0549a",                 "containerId": "e2e67737-18bf-437b-8230-8ec17da75096",                 "cost": **null**             }         \]     } \] |

### Creating/editing  document

| HTTP Method  | POST |
| :---- | :---- |
| URI | **/documents/writeoff** |
| Body | Lines 'dateIncoming', 'status', 'storeFromId', 'storeToId','productId', 'amount' are required  JSON {     "id": "0fd6f4ad-4858-401c-017d-22eacb7101a7",     "dateIncoming": "2021-11-15T06:00",     "documentNumber": "30002",     "status": "NEW",     "comment": "zzz",     "storeFromId": "05a407d4-d7c6-4bc2-a578-6ad5de99d468",     "storeToId": "370620fe-c789-46db-9d92-33bec29b82a3",     "items": \[         {             "productId": "ccdada6c-1643-4c52-9e09-752a4de117a0",             "amount": 5,             "containerId": "e2e67737-18bf-437b-8230-8ec17da75096"         },         {             "productId": "8972b757-4e08-4c50-a145-80cd12bb4f1e",             "amount": 5,             "containerId": "84d13550-d3c8-4f73-8e35-2ae470260bdc"         }     \] }  |
| Result |  [http://localhost:9080/resto/api/v2/documents/internalTransfer](http://localhost:9080/resto/api/v2/documents/internalTransfer)  JSON {     "result": "SUCCESS",     "errors": \[\],     "response": {         "id": "0fd6f4ad-4858-401c-017d-22eacb7101a7",         "dateIncoming": "2021-11-15T06:00",         "documentNumber": "30002",         "status": "NEW",         "comment": "zzz",         "storeFromId": "05a407d4-d7c6-4bc2-a578-6ad5de99d468",         "storeToId": "370620fe-c789-46db-9d92-33bec29b82a3",         "items": \[             {                 "num": 1,                 "productId": "ccdada6c-1643-4c52-9e09-752a4de117a0",                 "amount": 5,                 "measureUnitId": "cd19b5ea-1b32-a6e5-1df7-5d2784a0549a",                 "containerId": "e2e67737-18bf-437b-8230-8ec17da75096",                 "cost": **null**             },             {                 "num": 2,                 "productId": "8972b757-4e08-4c50-a145-80cd12bb4f1e",                 "amount": 5,                 "measureUnitId": "cd19b5ea-1b32-a6e5-1df7-5d2784a0549a",                 "containerId": "84d13550-d3c8-4f73-8e35-2ae470260bdc",                 "cost": **null**             }         \]     } }  |

# Checkout shifts

## Get information about checkout shifts

### List checkout shifts

| HTTP Method  | GET |
| :---- | :---- |
| URI | /**closeSession**/**list?dateFrom**\=**{dateFrom}\&dateTo**\=**{dateTo}** |
| Body | CloseSession*Dto*  structure |

#### XSD CloseSession

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema  xmlns:xs="http://www.w3.org/2001/XMLSchema"  xmlns:jaxb="http://java.sun.com/xml/ns/jaxb"  elementFormDefault="unqualified"  attributeFormDefault="unqualified"  jaxb:version="2.0"\>     \<xs:annotation\>         \<xs:appinfo\>             \<\!-- Mapping xs:date и xs:dateTime in java.util.Date. By default in XMLGregorianCalendar \--\>   \<jaxb:globalBindings\>                 \<jaxb:javaType   name="java.util.Date"   xmlType="xs:dateTime"   parseMethod="resto.utils.DateUtils.parseXsDateTime"   printMethod="resto.utils.DateUtils.printXsDateTime"/\>             \<jaxb:javaType   name="java.util.Date"   xmlType="xs:date"   parseMethod="resto.utils.DateUtils.parseXsDate"   printMethod="resto.utils.DateUtils.printXsDate"/\>             \</jaxb:globalBindings\>         \</xs:appinfo\>     \</xs:annotation\>     \<xs:element name="CloseSessionItem" type="CloseSessionItemDto"/\>     \<xs:complexType name="CloseSessionItemDto"\>         \<xs:sequence\>             \<\!-- Checkout shifts id (guid) \--\>   \<xs:element name="id" type="xs:string" minOccurs="0"/\>             \<\!-- CloseSessionEvent \--\>  \<\!-- Number checkout shifts--\>   \<xs:element name="sessionNumber" type="xs:int" minOccurs="0"/\>             \<\!-- Fiscal number checkout shifts \--\>   \<xs:element name="fiscalNumber" type="xs:int" minOccurs="0"/\>             \<\!-- Number fiscal registrar--\>   \<xs:element name="cashRegNumber" type="xs:int" minOccurs="0"/\>             \<\!-- Serial number fiscal registrar \--\>   \<xs:element name="cashRegSerial" type="xs:string" minOccurs="0"/\>             \<\!-- Shift opening date \--\>   \<xs:element name="openDate" type="xs:dateTime" minOccurs="0"/\>             \<\!-- Shift closing date \--\>   \<xs:element name="closeDate" type="xs:dateTime" minOccurs="0"/\>             \<\!-- The date the change was accepted. null \- change not accepted \--\>   \<xs:element name="acceptDate" type="xs:dateTime" minOccurs="0"/\>             \<\!-- Responsible manager--\>   \<xs:element name="manager" type="xs:string" minOccurs="0"/\>            \<\!-- Responsible cashier \--\>   \<xs:element name="responsibleUser" type="xs:string" minOccurs="0"/\>             \<\!-- Cash balance at the beginning of the day \--\>   \<xs:element name="sessionStartCash" type="xs:decimal" minOccurs="0"/\>             \<\!-- The sum of all orders, taking into account the discount and taking into account the prepayment--\>   \<xs:element name="payOrders" type="xs:decimal" minOccurs="0"/\>             \<\!-- The amount of orders closed at the expense of the institution \--\>   \<xs:element name="sumWriteoffOrders" type="xs:decimal" minOccurs="0"/\>             \<\!-- Amount of cash sales \--\>   \<xs:element name="salesCash" type="xs:decimal" minOccurs="0"/\>             \<\!-- Amount of sales on credit \--\>   \<xs:element name="salesCredit" type="xs:decimal" minOccurs="0"/\>             \<\!-- Amount of card sales--\>   \<xs:element name="salesCard" type="xs:decimal" minOccurs="0"/\>             \<\!-- Sum of all deposits \--\>  \<xs:element name="payIn" type="xs:decimal" minOccurs="0"/\>             \<\!-- Sum of all withdrawals, excluding withdrawals at the end of the shift \--\>  \<xs:element name="payOut" type="xs:decimal" minOccurs="0"/\>             \<\!-- Withdrawal amount at the end of the shift \--\>  \<xs:element name="payIncome" type="xs:decimal" minOccurs="0"/\>             \<\!-- Cash balance after shift closing \--\>  \<xs:element name="cashRemain" type="xs:decimal" minOccurs="0"/\>             \<\!-- The general discrepancy between book and actual amounts--\>  \<xs:element name="cashDiff" type="xs:decimal" minOccurs="0"/\>             \<\!-- Shift status \--\>  \<xs:element name="sessionStatus" type="ClosedSessionStatusDto" minOccurs="0"/\>             \<\!-- Conceptions checkout shift--\>  \<xs:element name="conception" type="ConceptionDto" minOccurs="0"/\>             \<\!-- Point of sale of this checkout shift \--\>  \<xs:element name="pointOfSale" type="xs:string" minOccurs="0"/\>              \<\!-- Z-report number \--\>  \<xs:element name="zreport" type="xs:int" minOccurs="0"/\>             \<\!--Accumulated amount in fiscal memory--\>  \<xs:element name="accumulatedamountfiscalmemory" type="xs:decimal" minOccurs="0"/\>             \<\!--Amount subject to VAT \--\>  \<xs:element name="sumWithNds" type="xs:decimal" minOccurs="0"/\>             \<\!-- Amount that was not subject to VAT \--\>  \<xs:element name="sumWithoutNds" type="xs:decimal" minOccurs="0"/\>               \<xs:element name="sumWithoutNds21" type="xs:decimal" minOccurs="0"/\>               \<xs:element name="sumNds21" type="xs:decimal" minOccurs="0"/\>        \<xs:element name="sumWithoutNds12" type="xs:decimal" minOccurs="0"/\>              \<xs:element name="sumNds12" type="xs:decimal" minOccurs="0"/\>               \<xs:element name="SaleSumWithNdsDep1" type="xs:decimal" minOccurs="0"/\>              \<xs:element name="SumNdsDep1" type="xs:decimal" minOccurs="0"/\>           \<xs:element name="SaleSumWithNdsDep2" type="xs:decimal" minOccurs="0"/\>              \<xs:element name="SumNdsDep2" type="xs:decimal" minOccurs="0"/\>         \</xs:sequence\>     \</xs:complexType\>     \<xs:simpleType name="ClosedSessionStatusDto"\>         \<xs:restriction base="xs:string"\>          \<xs:enumeration value="UNACCEPTED"/\>               \<xs:enumeration value="ACCEPTED"/\>              \<xs:enumeration value="HASWARNINGS"/\>         \</xs:restriction\>     \</xs:simpleType\>     \<xs:complexType name="ConceptionDto"\>         \<xs:sequence\>             \<\!-- Identifier \--\>  \<xs:element name="id" type="xs:string" minOccurs="0"/\>             \<\!-- Code \--\>  \<xs:element name="code" minOccurs="0" type="xs:string"/\>             \<\!-- Name \--\>  \<xs:element name="name" minOccurs="0" type="xs:string"/\>         \</xs:sequence\>     \</xs:complexType\> \</xs:schema\>  |

##### Request example

| [http://localhost:9080/resto/api/closeSession/list?dateFrom=2016-01-01\&dateTo=2017-01-01\&key=ebe33d7b-6331-dfa3-8aaa-acc233a60b78](http://localhost:9080/resto/api/closeSession/list?dateFrom=2016-01-01&dateTo=2017-01-01&key=ebe33d7b-6331-dfa3-8aaa-acc233a60b78) |
| :---- |

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<closeSessionItemDtoes\> \<CloseSessionItemDto\> \<id\>71ce201a-8914-4a75-8bfb-efcb5ff38d67\</id\> \<sessionNumber\>63\</sessionNumber\> \<fiscalNumber\>285\</fiscalNumber\> \<cashRegNumber\>4\</cashRegNumber\> \<cashRegSerial\>382108\</cashRegSerial\> \<openDate\>2016-10-24T08:27:41\</openDate\> \<manager\>f4fcdac9-ca15-471d-b9ab-d88e8685242e\</manager\> \<sessionStartCash\>0.000000000\</sessionStartCash\> \<payOrders\>15280.000000000\</payOrders\> \<sumWriteoffOrders\>0.000000000\</sumWriteoffOrders\> \<salesCash\>8760.000000000\</salesCash\> \<salesCredit\>0.000000000\</salesCredit\> \<salesCard\>6520.000000000\</salesCard\> \<payIn\>3430.000000000\</payIn\> \<payOut\>0.000000000\</payOut\> \<payIncome\>0.000000000\</payIncome\> \<cashDiff\>0.000000000\</cashDiff\> \<sessionStatus\>UNACCEPTED\</sessionStatus\> \<pointOfSale\>fe657069-d125-49b6-b487-65e899825f72\</pointOfSale\> \<zreport\>0\</zreport\> \<accumulatedamountfiscalmemory\>0\</accumulatedamountfiscalmemory\> \<sumWithNds\>0\</sumWithNds\> \<sumWithoutNds\>0\</sumWithoutNds\> \<sumWithoutNds21\>0\</sumWithoutNds21\> \<sumNds21\>0\</sumNds21\> \<sumWithoutNds12\>0\</sumWithoutNds12\> \<sumNds12\>0\</sumNds12\> \<SaleSumWithNdsDep1\>0\</SaleSumWithNdsDep1\> \<SumNdsDep1\>0\</SumNdsDep1\> \<SaleSumWithNdsDep2\>0\</SaleSumWithNdsDep2\> \<SumNdsDep2\>0\</SumNdsDep2\> \</CloseSessionItemDto\> \<CloseSessionItemDto\> \<id\>3ed77273-d84d-4e46-bd65-a697c161aa1d\</id\> \<sessionNumber\>5\</sessionNumber\> \<cashRegNumber\>996\</cashRegNumber\> \<openDate\>2016-12-09T16:19:32\</openDate\> \<manager\>f4fcdac9-ca15-471d-b9ab-d88e8685242e\</manager\> \<sessionStartCash\>0.000000000\</sessionStartCash\> \<payOrders\>560.000000000\</payOrders\> \<sumWriteoffOrders\>0.000000000\</sumWriteoffOrders\> \<salesCash\>0.000000000\</salesCash\> \<salesCredit\>560.000000000\</salesCredit\> \<salesCard\>0.000000000\</salesCard\> \<payIn\>0.000000000\</payIn\> \<payOut\>0.000000000\</payOut\> \<payIncome\>0.000000000\</payIncome\> \<cashDiff\>0.000000000\</cashDiff\> \<sessionStatus\>UNACCEPTED\</sessionStatus\> \<pointOfSale\>8c5dc3f1-965d-4e69-b8af-9bf2334c72b3\</pointOfSale\> \<zreport\>0\</zreport\> \<accumulatedamountfiscalmemory\>0\</accumulatedamountfiscalmemory\> \<sumWithNds\>0\</sumWithNds\> \<sumWithoutNds\>0\</sumWithoutNds\> \<sumWithoutNds21\>0\</sumWithoutNds21\> \<sumNds21\>0\</sumNds21\> \<sumWithoutNds12\>0\</sumWithoutNds12\> \<sumNds12\>0\</sumNds12\> \<SaleSumWithNdsDep1\>0\</SaleSumWithNdsDep1\> \<SumNdsDep1\>0\</SumNdsDep1\> \<SaleSumWithNdsDep2\>0\</SaleSumWithNdsDep2\> \<SumNdsDep2\>0\</SumNdsDep2\> \</CloseSessionItemDto\> \<CloseSessionItemDto\> \<id\>8b28752a-edb6-4a1e-b568-650dbebd6a2c\</id\> \<sessionNumber\>35\</sessionNumber\> \<fiscalNumber\>330\</fiscalNumber\> \<cashRegNumber\>5\</cashRegNumber\> \<cashRegSerial\>465171\</cashRegSerial\> \<openDate\>2016-10-24T08:35:09\</openDate\> \<manager\>f4fcdac9-ca15-471d-b9ab-d88e8685242e\</manager\> \<sessionStartCash\>0.000000000\</sessionStartCash\> \<payOrders\>22720.000000000\</payOrders\> \<sumWriteoffOrders\>0.000000000\</sumWriteoffOrders\> \<salesCash\>13280.000000000\</salesCash\> \<salesCredit\>0.000000000\</salesCredit\> \<salesCard\>9440.000000000\</salesCard\> \<payIn\>4100.000000000\</payIn\> \<payOut\>0.000000000\</payOut\> \<payIncome\>0.000000000\</payIncome\> \<cashDiff\>0.000000000\</cashDiff\> \<sessionStatus\>UNACCEPTED\</sessionStatus\> \<pointOfSale\>8c5dc3f1-965d-4e69-b8af-9bf2334c72b3\</pointOfSale\> \<zreport\>0\</zreport\> \<accumulatedamountfiscalmemory\>0\</accumulatedamountfiscalmemory\> \<sumWithNds\>0\</sumWithNds\> \<sumWithoutNds\>0\</sumWithoutNds\> \<sumWithoutNds21\>0\</sumWithoutNds21\> \<sumNds21\>0\</sumNds21\> \<sumWithoutNds12\>0\</sumWithoutNds12\> \<sumNds12\>0\</sumNds12\> \<SaleSumWithNdsDep1\>0\</SaleSumWithNdsDep1\> \<SumNdsDep1\>0\</SumNdsDep1\> \<SaleSumWithNdsDep2\>0\</SaleSumWithNdsDep2\> \<SumNdsDep2\>0\</SumNdsDep2\> \</CloseSessionItemDto\> \</closeSessionItemDtoes\> |

## Export information about checkout shifts

| HTTP Method  | GET |
| :---- | :---- |
| URI | **cashshifts/payments/list/{sessionId}** |
| Result | Json structure |

### Parameters

| Code | Name Code | Comments |
| :---- | :---- | :---- |
| hideAccepted | true, false | hide accepted |

#### Result

| Code | Name Code |
| :---- | :---- |
| sessionId | Checkout shifts ID |
| cashlessRecords | List of entries related to non-cash payments |
| payInRecords | List of records related to contributions. |
| payOutRecords | List of entries related to seizures. |

| Code | Name Code |
| :---- | :---- |
| info | Wiring Description Code Name Code id Transaction ID date Creation date in the format "yyyy-MM-dd'T'HH:MM:SS" creationDate Creation date in the format "yyyy-MM-dd'T'HH:MM:SS" with reference to time, may be less than the date, if the setting "end of accounting day" \<\> 00:00 is used. group Transaction group: CARD CREDIT PAYOUT PAYIN  accountId Editable account. More often, the final account of the transaction is accepted. counteragentId Contagent ID paymentTypeId Payment type type Transaction type sum Summ comment Comment auth Code Name Code user User ID card Card number causeEvenId UUID of the order payment event. cashierId The UUID of the cashier who made the transaction. departmentId Departament ID cashFlowCategory Code Name Code code Code parentCategory Parent Category type Type: OPERATIONAL INVESTMENT FINANCE  |
| actualSum | Transaction sum |
| originalSum | Transaction sum |
| editedPayAccountId | Editable financial transaction |
| originalPayAccountId | Payment, whose value is the same as editedPayAccountId. |
| payAgentId | Contractor from shift closing document element excess if no such element is found. |
| paymentTypeId | Payment type |
| editableComment | Comment |

##### Request example

| [localhost:8080/resto/api/v2/cashshifts/payments/list/f67fea0a-90d4-427c-ac3d-b82c1582f7f9?hideAccepted=false](http://localhost:8080/resto/api/v2/payments/list/f67fea0a-90d4-427c-ac3d-b82c1582f7f9?key=69a6bf4c-b13a-61ee-b5ac-f6c8d0acb827&hideAccepted=false) |
| :---- |

| JSON |
| :---- |
| {     "sessionId":"f67fea0a-90d4-427c-ac3d-b82c1582f7f9",    "cashlessRecords":\[       \],    "payInRecords":\[       \],    "payOutsRecords":\[        {           "info":{              "id":"e08a16b6-931c-4068-9aa5-b740d5ce726b",             "date":"2017-05-03T00:00:00",             "creationDate":"2017-05-03T14:08:56.027",             "group":"PAYOUT",             "accountId":"ad3cc1aa-a60e-c85c-e66d-3904490de4b9",             "counteragentId":"2c6f7e76-2fee-473e-879e-4c4c2faaa032",             "paymentTypeId":null,             "type":"PAYCOL",             "sum":2660,             "comment":"Closed checkout shifts",             "auth":{                 "user":"2c6f7e76-2fee-473e-879e-4c4c2faaa032",                "card":"8888"             },             "causeEventId":"4fc18ec8-8442-4128-858f-0896550d09a8",             "cashierId":"2c6f7e76-2fee-473e-879e-4c4c2faaa032",             "departmentId":"cb90393a-8299-4af1-9fab-5ec308726266",             "cashFlowCategory":{                 "id":"14c0fe4b-76ec-2681-846e-81d1ec32db08",                "code":"1",                "parentCategoryId":null,                "type":"OPERATIONAL"             }          },          "actualSum":2660,          "originalSum":2660,          "editedPayAccountId":"ad3cc1aa-a60e-c85c-e66d-3904490de4b9",          "originalPayAccountId":"ad3cc1aa-a60e-c85c-e66d-3904490de4b9",          "payAgentId":"ad3cc1aa-a60e-c85c-e66d-3904490de4b9",          "paymentTypeId":null,          "editableComment":"test",          "status":"ACCEPTED"       }    \] }  |

## List checkout shifts 

### Parameters

| Code | Name Code | Comments |
| :---- | :---- | :---- |
| openDateFrom | YYYY-MM-DD | Shift opening period "from" (included in the interval)  |
| openDateTo | YYYY-MM-DD | Shift opening period "to" (included in the interval) |
| departmentId | UUID | List department. If the value is null, the filter isn\`t active. |
| groupId | UUID | List group.  If the value is null, the filter isn\`t active. |
| status | String Value is: ANY OPEN CLOSED ACCEPTED UNACCEPTED HASWARNINGS |  |

#### Result

| Code | Name Code |
| :---- | :---- |
| id | Checkout shifts ID |
| sessionNumber | Session number |
| fiscalNumber | Fiscal number  |
| cashRegNumber | Cash registration number  |
| cashRegSerial | Cash registration serial number |
| openDate | Open date  |
| closeDate | Close Date |
| acceptDate | The date the change was accepted. null \--- change not accepted. |
| managerId | Responsible manager. |
| responsibleUser | Responsible cashier. |
| sessionStartCash | The balance in the cash register at the beginning of the day. |
| payOrders | Amount of discounted orders |
| sumWriteoffOrders | The amount of orders is closed at the expense of the institution. |
| salesCash | Cash sale amount |
| salesCerdit | Credit sale amount |
| salesCard | Card sale amount |
| payIn | The sum of all contributions |
| payOut | The sum of all withdrawals |
| payIncome | Amount withdrawn at the end of the shift. |
| cashRemain | The balance in the cash register after the closing of the shift. |
| cashDiff | General discrepancy between book and actual amounts. |
| sessionStaus | Session status |
| conception | Conception  |
| pointOfSale | Point of sale  |

##### Request example

| [localhost:8080/resto/api/v2/cashshifts/list?openDateFrom=2017-05-01\&openDateTo=2017-05-31\&status=ANY](http://localhost:8080/resto/api/v2/cashshifts/export/list?key=ca3fbadc-19b4-1a7f-d1dd-7840a268c4b9&openDateFrom=2017-05-01&openDateTo=2017-05-31&status=ANY) |
| :---- |

| JSON |
| :---- |
| \[     {        "id":"1c81b65a-1b8a-428f-8a74-2c994a928a86",       "sessionNumber":583,       "fiscalNumber":1003,       "cashRegNumber":1,       "cashRegSerial":"115744 ",       "openDate":"2017-02-21T09:56:32.937",       "closeDate":"2017-02-21T22:28:18.63",       "acceptDate":null,       "managerId":"173f155b-48e5-4da0-a9e7-3caa58cfa9d0",       "responsibleUser":"173f155b-48e5-4da0-a9e7-3caa58cfa9d0",       "sessionStartCash":0,       "payOrders":21351,       "sumWriteoffOrders":0,       "salesCash":9787,       "salesCredit":0,       "salesCard":11564,       "payIn":2000,       "payOut":0,       "payIncome":-11787,       "cashRemain":0,       "cashDiff":-11787,       "sessionStatus":"UNACCEPTED",       "conception":"bd6daa35-12ce-4117-af8f-816d99720eeb",       "pointOfSale":"1b17ee6b-c499-4916-9347-fe854d3067b4"    },    {        "id":"43aab17c-ab23-4d5a-91f0-9fa39fac8612",       "sessionNumber":145,       "fiscalNumber":306,       "cashRegNumber":3,       "cashRegSerial":"115731 ",       "openDate":"2017-02-21T10:00:51.733",       "closeDate":"2017-02-21T23:16:59.13",       "acceptDate":null,       "managerId":"173f155b-48e5-4da0-a9e7-3caa58cfa9d0",       "responsibleUser":"173f155b-48e5-4da0-a9e7-3caa58cfa9d0",       "sessionStartCash":0,       "payOrders":34885,       "sumWriteoffOrders":0,       "salesCash":0,       "salesCredit":0,       "salesCard":34885,       "payIn":0,       "payOut":0,       "payIncome":0,       "cashRemain":0,       "cashDiff":0,       "sessionStatus":"UNACCEPTED",       "conception":"bd6daa35-12ce-4117-af8f-816d99720eeb",       "pointOfSale":"e49cda0d-f3b1-4a8a-901e-7c44ee09c5a2"    },    {        "id":"f67fea0a-90d4-427c-ac3d-b82c1582f7f9",       "sessionNumber":1,       "fiscalNumber":null,       "cashRegNumber":998,       "cashRegSerial":null,       "openDate":"2017-05-03T14:07:44.11",       "closeDate":"2017-05-03T14:08:57.307",       "acceptDate":"2017-05-24T11:55:13.907",       "managerId":"2c6f7e76-2fee-473e-879e-4c4c2faaa032",       "responsibleUser":"2c6f7e76-2fee-473e-879e-4c4c2faaa032",       "sessionStartCash":0,       "payOrders":2660,       "sumWriteoffOrders":0,       "salesCash":2660,       "salesCredit":0,       "salesCard":0,       "payIn":0,       "payOut":0,       "payIncome":-2660,       "cashRemain":0,       "cashDiff":-2660,       "sessionStatus":"HASWARNINGS",       "conception":null,       "pointOfSale":"4138237d-c4db-4bfb-b52e-18e1bb4f12e5"    } \] |

## Export checkout shifts by id

| HTTP Method  | GET |
| :---- | :---- |
| URI | **cashshifts/byId/{sessionId}** |
| Body | JSON structure |

##### Request example

| [localhost:8080/resto/api/v2/cashshifts/byId/1c81b65a-1b8a-428f-8a74-2c994a928a86](http://localhost:8080/resto/api/v2/cashshifts/export/byId/1c81b65a-1b8a-428f-8a74-2c994a928a86?key=df1a8ae5-45a3-54a6-2c00-5ec1222a5194) |
| :---- |

| JSON |
| :---- |
| {     "id":"1c81b65a-1b8a-428f-8a74-2c994a928a86",    "sessionNumber":583,    "fiscalNumber":1003,    "cashRegNumber":1,    "cashRegSerial":"115744 ",    "openDate":"2017-02-21T09:56:32.937",    "closeDate":"2017-02-21T22:28:18.63",    "acceptDate":null,    "manager":"173f155b-48e5-4da0-a9e7-3caa58cfa9d0",    "responsibleUser":"173f155b-48e5-4da0-a9e7-3caa58cfa9d0",    "sessionStartCash":0,    "payOrders":21351,    "sumWriteoffOrders":0,    "salesCash":9787,    "salesCredit":0,    "salesCard":11564,    "payIn":2000,    "payOut":0,    "payIncome":-11787,    "cashRemain":0,    "cashDiff":-11787,    "sessionStatus":"UNACCEPTED",    "conception":"bd6daa35-12ce-4117-af8f-816d99720eeb",    "pointOfSale":"1b17ee6b-c499-4916-9347-fe854d3067b4" } |

## Export documents on acceptance of a cash register shift by id

| HTTP Method  | GET |
| :---- | :---- |
| URI | **cashshifts/closedSessionDocument/{id}** |
| Body | JSON structure |

#### Result

| Code | Name Code |
| :---- | :---- |
| id | Document ID |
| session | This is checkout shifts Code Name Code sessionId Session ID groupId Group ID number Checkout shift  |
| accountShortageId | The account to which the shortage is recorded. |
| counteragentShortageId | The counteragent to which the shortage is recorded.  |
| accountSurplusId | The account to which the surplus is credited. |
| counteragentSurplusId | The counteragent  to which the surplus is credited. |
| departmentId | Department ID |
| items |  Code Name Code num Number item transactionId Transaction ID sumReal Edited amount accountOverrideId Edited account counteragentOverrideId Edited counteragent  status Code ACCEPTED UNACCEPTED HASWARNINGS comment Comment  |

##### Request example

| [localhost:8080/resto/api/v2/cashshifts/closedSessionDocument/f67fea0a-90d4-427c-ac3d-b82c1582f7f9](http://localhost:8080/resto/api/v2/cashshifts/export/closedSessionDocument/f67fea0a-90d4-427c-ac3d-b82c1582f7f9?key=d372c4cb-0dc6-c7d3-e9bf-e0ce92757dca) |
| :---- |

| JSON |
| :---- |
| {     "id":"1a94e9e8-56cf-3a14-015b-ce1629e5006b",    "session":{        "sessionId":"f67fea0a-90d4-427c-ac3d-b82c1582f7f9",       "groupId":"94a6f400-2f9b-4a5a-be7f-19b7b62c55a7",       "number":1    },    "accountShortageId":null,    "counteragentShortageId":null,    "accountSurplusId":null,    "counteragentSurplusId":"2c6f7e76-2fee-473e-879e-4c4c2faaa032",    "departmentId":"cb90393a-8299-4af1-9fab-5ec308726266",    "items":\[        {           "num":0,          "transactionId":"e08a16b6-931c-4068-9aa5-b740d5ce726b",          "sumReal":2660,          "accountOverrideId":"ad3cc1aa-a60e-c85c-e66d-3904490de4b9",          "counteragentOverrideId":"2c6f7e76-2fee-473e-879e-4c4c2faaa032",          "status":"ACCEPTED",          "comment":"test"       }    \] }  |

## Checkout shift acceptance

### Checkout shift acceptance algoritm 

1. You must get a checkout shift ID.  
2. You must get documents on acceptance of a cash register shift by id.  
3. You must get a list of non-cash payments, contributions, withdrawals.  
4. Supplement the list of document elements with the missing ones

   The list from par. 3 contains all shift postings. The shift acceptance document from par. 2 consists of elements that edit such wires. If there are transactions for which there are no items in the document (for example, when a shift closes for the first time), then you need to add new elements. In other words, the shift acceptance document must contain all the postings from par. 3\. A new element is added based on the entry from the list obtained in par. 3, as follows: 

- The num field is set to the next serial number.   
- The transactionId field is set to the UUID of the transaction to be added.   
- The sumReal field indicates the result of editing the transaction amount: the sum field. sumReal is filled only for seizures. those. for records from payOutRecords. For other entries, the amount is not editable.   
- In the accountOverride field, set the result of editing the account from the accountId field. In counteragentOverride result of editing counteragentId with some rules.   
- The desired status and comment are indicated.  
5. Edit document.  
6. Send to server.

| HTTP Method | POST |
| :---- | :---- |
| URL | **cashshifts/save** |
| Header | Content-Type: application/json |
| Body |  Code Name Code id Document ID session Checkout shift Code Name Code sessionId Session ID group Group ID number Number accountShortageId The account to which the shortage is recorded. counteragentShortageId The counteragent to which the shortage is recorded. accountSurplusId The account to which the surplus is credited. counteragentSurplusId The counteragent  to which the surplus is credited. departmentId Department ID items Code Name Code num Number item transactionId Transaction ID sumReal Edited amount accountOverrideId Edited account counteragentOverrideId Edited counteragent  status Code ACCEPTED UNACCEPTED HASWARNINGS comment Comment \[1\].Accounts/counterparties for shortage/surplus must be completed regardless of the selected account. This is done for backwards compatibility. \[2\]. The counterparty in the document element must be specified only for accounts: Code Name Code ACCOUNTS\_RECEIVABLE Buyer Debt DEBTS\_OF\_EMPLOYEES Employee debt EMPLOYEES\_LIABILITY Settlements with employees ACCOUNTS\_PAYABLE Settlements with suppliers CLIENTS\_LIABILITY Settlements with guests  |

| Body |
| :---- |
| {     "id":"1a94e9e8-56cf-3a14-015b-ce1629e5006b",    "session":{        "sessionId":"f67fea0a-90d4-427c-ac3d-b82c1582f7f9",       "groupId":"94a6f400-2f9b-4a5a-be7f-19b7b62c55a7",       "number":1    },    "accountShortageId":"ad3cc1aa-a60e-c85c-e66d-3904490de4b9",    "counteragentShortageId":"2c6f7e76-2fee-473e-879e-4c4c2faaa032",    "accountSurplusId":"ad3cc1aa-a60e-c85c-e66d-3904490de4b9",    "counteragentSurplusId":"2c6f7e76-2fee-473e-879e-4c4c2faaa032",    "departmentId":"cb90393a-8299-4af1-9fab-5ec308726266",    "items":\[        {           "num":0,          "transactionId":"e08a16b6-931c-4068-9aa5-b740d5ce726b",          "sumReal":2650,          "accountOverrideId":"ad3cc1aa-a60e-c85c-e66d-3904490de4b9",          "counteragentOverrideId":"2c6f7e76-2fee-473e-879e-4c4c2faaa032",          "status":"ACCEPTED",          "comment":"test"       }    \] }  |

#### Result

| Code | Name Code |
| :---- | :---- |
| importResult | Status import:\- SUCCESS; \- ERROR. |
| status | Accepted shift status. Calculated from the totality of document element statuses.  The element status is set by the user. If at least one element has the HASWARNINGS status, then the entire document will be in the HASWARNINGS status if at least one element is in the UNACCEPTED status, then the whole document will be in the same status, ACCEPTED \- all elements are accepted. HASWARNINGS has the highest priority. Code UNACCEPTED ACCEPTED HASWARNINGS  |
| errors |  Code Name Code documentError This is an error line document. itemError Code Name Code identifier Item UUID error  |
| document | This is document for import |

### Error

| Code | Name code |
| :---- | :---- |
| value | Invalid value or empty field name |
| code | Error code |

#### Error code

| Code | Name code |
| :---- | :---- |
| ACCOUNT\_DELETED | The specified account has been deleted. |
| COUNTERAGENT\_DELETED | The specified counterparty has been deleted. |
| INVENTORY\_ASSETS\_TYPE\_NOT\_ALLOWED | Inventory category accounts are not allowed. |
| COUNTERAGENT\_MISSED\_FOR\_ACCOUNT | A counterparty must be specified for the specified account. |
| COUNTERAGENT\_NOT\_ALLOWED\_FOR\_ACCOUNT | The counterparty is not specified for the specified account. |
| ACCOUNT\_NOT\_SPECIFIED | Account not specified. |
| COUNTERAGENT\_NOT\_SPECIFIED | The counterparty is not specified. |
| COUNTERAGENT\_NOT\_ALLOWED | The counterparty is NOT specified. |
| COUNTERAGENT\_TYPE\_WRONG | The type specified for the selected account is incorrect. |
| CONCEPTION\_NOT\_SPECIFIED | Conception is not specified  |
| CONCEPTION\_DELETED | Conception is deleted |
| PAYROLL\_MISSED\_FOR\_ACCOUNT | The specified account must have a payroll |
| PAYROLL\_DELETED | Payroll is deleted |
| ONLY\_POSITIVE\_VALUES\_ALLOWED | Only values greater than 0 are allowed |
| DEPARTMENT\_DELETED | Department is deleted |
| RESTAURANT\_SECTION\_DELETED | Restaurant section is deleted |
| MEASURE\_UNIT\_DELETED | Measure unit is deleted |
| COOKING\_PLACE\_DELETED | Cooking place is deleted |
| TAX\_CATEGORY\_DELETED | Tax category is deleted |
| PRODUCT\_CATEGORY\_DELETED | Product category is deleted |
| PRODUCT\_GROUP\_DELETED | Product group is deleted |
| PRODUCT\_DELETED | Product is deleted |
| PRODUCT\_MISSED | Product is missed |
| COOKING\_PLACE\_EMPTY\_FOR\_SALE\_DISH | This is cooking place empty for sale item  |
| WRONG\_NOMENCLATURE\_TYPE | Item type is wrong |
| NOT\_INCLUDED\_IN\_MENU\_WITH\_EXCLUDED\_SECTIONS | The item has compartments in which it cannot be sold, while the dish itself is not included in the default menu. |
| CHILD\_MODIFIERS\_NOT\_ALLOWED | Child modifiers is not allowed |
| MODIFIER\_NOT\_BELONGS\_TO\_GROUP | Modifier is not belongs to group |
| NOT\_MODIFIER | This position is not modifier  |
| WRONG\_MIN\_MAX\_AMOUNT | The minimum and maximum values are incorrect. |
| HAS\_RESTRICTION\_AND\_DEFAULT\_AMOUNT\_OUT\_OF\_RANGE | The parent modifier has "Restriction on the minimum and maximum for child modifiers", but the default value of the child modifier goes beyond min. Max. values. |
| DEFAULT\_AMOUNT\_OUT\_OF\_RANGE | The default value is outside the min. Max. values. |
| NO\_RESTRICTION\_AND\_MIN\_MAX\_NOT\_ZERO | Parent modifier DISABLED "Restriction on minimum and maximum for child modifiers", at child min. Max. the number is not 0 (and it should). |
| REQUIRED\_AND\_WRONG\_MIN\_AMOUNT | Modifier is required, but min. quantity to equal 0 or he is not required and min. value is not equal 0\.  |
| FREE\_OF\_CHARGE\_AMOUNT\_MORE\_THAN\_MAX | A group or single modifier has more free ones than the maximum |
| HAS\_RESTRICTION\_AND\_FREE\_OF\_CHARGE\_MORE\_THAN\_MAX | The parent modifier has "Restriction on the minimum and maximum of child modifiers" ON, but the free amount of the child modifier is greater than the maximum. |
| HAS\_RESTRICTION\_AND\_FREE\_OF\_CHARGE\_MORE\_THAN\_PARENT | The parent modifier has "Restriction on the minimum and maximum of child modifiers" ON, but the free amount of the child modifier is greater than that of the parent. |
| NO\_RESTRICTION\_AND\_FREE\_OF\_CHARGE\_AMOUNT\_NOT\_EQUAL\_VALUE\_IN\_PARENT | The parent modifier has "Restriction on the minimum and maximum for child modifiers" OFF, but the free amount of the child modifier is not equal to the free amount of the parent modifier. |
| NO\_RESTRICTION\_AND\_REQUIRED\_SHOULD\_BE\_FALSE | Parent modifier DISABLED "Restriction on minimum and maximum for child modifiers", but the child modifier is required. |
| NOT\_GROUP\_MODIFIER\_HAS\_CHILD\_RESTRICTION | A non-group (single, child) modifier has "Restriction on the minimum and maximum of child modifiers" ON. |
| SINGLE\_MODIFIER\_HIDE\_DEFAULT\_AMOUNT | Single modifier has "Hide if default count" ON. |
| PARENT\_AMOUNT\_BY\_DEFAULT\_NOT\_EQUAL\_SUM\_OF\_CHILDREN | For a parent modifier, the default count is not equal to the sum of the default values of the child elements. |
| IMAGE\_NOT\_FOUND | Image not found. |

##### Request example

| http://[localhost:8080/resto/api/v2/cashshifts/save](http://localhost:8080/resto/api/v2/cashshifts/import/closedSessionDocument?key=7f672f60-3f39-ba5f-adca-167659d81e9a)  |
| :---- |

| JSON |
| :---- |
| {     "id":"1a94e9e8-56cf-3a14-015b-ce1629e5006b",    "session":{        "sessionId":"f67fea0a-90d4-427c-ac3d-b82c1582f7f9",       "groupId":"94a6f400-2f9b-4a5a-be7f-19b7b62c55a7",       "number":1    },    "accountShortageId":"ad3cc1aa-a60e-c85c-e66d-3904490de4b9",    "counteragentShortageId":"2c6f7e76-2fee-473e-879e-4c4c2faaa032",    "accountSurplusId":"ad3cc1aa-a60e-c85c-e66d-3904490de4b9",    "counteragentSurplusId":"2c6f7e76-2fee-473e-879e-4c4c2faaa032",    "departmentId":"cb90393a-8299-4af1-9fab-5ec308726266",    "items":\[        {           "num":0,          "transactionId":"e08a16b6-931c-4068-9aa5-b740d5ce726b",          "sumReal":2650,          "accountOverrideId":"ad3cc1aa-a60e-c85c-e66d-3904490de4b9",          "counteragentOverrideId":"2c6f7e76-2fee-473e-879e-4c4c2faaa032",          "status":"ACCEPTED",          "comment":"test"       }    \] } |

# Corporation

## Structure hierarchy

| HTTP Method  | GET |
| :---- | :---- |
| URI | /**corporation**/**departments**/  |
| Result | *corporateItemDto structure* |
| Description  |  Code CORPORATION  JURPERSON  ORGDEVELOPMENT  DEPARTMENT  MANUFACTURE  CENTRALSTORE  CENTRALOFFICE  SALEPOINT  STORE   |

##### Request example

| http://localhost:8080/resto/api/corporation/departments?key=420d0839-2aa7-801e-9f1a-cf7d23f65fba |
| :---- |

## List stores 

| HTTP Method  | GET |
| :---- | :---- |
| URI | /**corporation**/**stores**/  |
| Result | corporateItemDto  structure |

##### Request example

| http://localhost:8080/resto/api/corporation/stores?key=71046728-36fa-053c-b01c-c5b43bfd277f |
| :---- |

## List group and department 

| HTTP Method  | GET |
| :---- | :---- |
| URI | /**corporation**/**groups**/  |
| Result | All groups of departments, departments and points of sale in the form of a structure |

##### Request example

| http://localhost:8080/resto/api/corporation/groups?key=71046728-36fa-053c-b01c-c5b43bfd277f |
| :---- |

## List terminals

| HTTP Method  | GET |
| :---- | :---- |
| URI | /**corporation**/**terminals**/  |
| Result | All terminals of departments,in the form of a terminalDto structure  |

##### Request example

| http://localhost:8080/resto/api/corporation/terminals?key=71046728-36fa-053c-b01c-c5b43bfd277f |
| :---- |

## Department search

| HTTP Method  | GET |
| :---- | :---- |
| URI | /**corporation**/**departments**/**search** |
| Result | *corporateItemDto* structure  |

### Parameters 

| Code | Name code | Description  |
| :---- | :---- | :---- |
| code | **\[departmentCode\]** | Trading company code. The value of the \<code\> element from the corporateItemDto structure Regular expression |

##### Request example

| http://localhost:8080/resto/api/corporation/departments/search?key=71046728-36fa-053c-b01c-c5b43bfd277f\&code=1 |
| :---- |

## Store search

| HTTP Method  | GET |
| :---- | :---- |
| URI | /**corporation**/**stores**/**search** |
| Result | *corporateItemDto* structure  |

### Parameters 

| Code | Name code | Description  |
| :---- | :---- | :---- |
| code | **\[storeCode\]** | The warehouse code is a regular expression. If given as just a string, it searches for any occurrence of this string in the warehouse code, case sensitive |

##### Request example

| http://localhost:8080/resto/api/corporation/stores/search?key=71046728-36fa-053c-b01c-c5b43bfd277f\&code=Dom |
| :---- |

## Branch groups search

| HTTP Method  | GET |
| :---- | :---- |
| URI | /**corporation**/**groups**/**search** |
| Result | *groupDto* structure  |

### Parameters 

| Code | Name code | Description  |
| :---- | :---- | :---- |
| **name** | **regex** | Group name |
| **departmentId** | **uuid** | Department ID |

##### Request example

| http://localhost:8080/resto/api/corporation/terminal/search?key=71046728-36fa-053c-b01c-c5b43bfd277f\&name=New%20group  |
| :---- |

## Terminal search

| HTTP Method  | GET |
| :---- | :---- |
| URI | /**corporation**/**terminals**/**search** |
| Result | *terminalDto* structure  |

### Parameters 

| Code | Name code | Description  |
| :---- | :---- | :---- |
| **name** | **regex** | Group name |
| **computerName**  | **regex** | Department ID |
| **anonymous** | **false/true** | Fronts have anonymous=false, backoffices and system terminals have true |

##### Request example

| http://localhost:8080/resto/api/corporation/terminals/search?key=71046728-36fa-053c-b01c-c5b43bfd277f\&anonymous=false |
| :---- |

## XSD Group of branches and points of sale

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   	\<xs:element name="groupDto" type="groupDto"/\>   	\<xs:complexType name="groupDto"\>     	\<xs:sequence\>         	\<xs:element name="id" type="xs:string" minOccurs="1"/\>         	\<xs:element name="name" type="xs:string" minOccurs="1"/\>         	\<xs:element name="departmentId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="pointOfSaleDtoes" minOccurs="1"\>             	\<xs:complexType\>                 	\<xs:sequence\>                     	\<xs:element name="pointOfSaleDto" type="pointOfSaleDto" minOccurs="0"/\>                 	\</xs:sequence\>             	\</xs:complexType\>         	\</xs:element\>         	\<xs:element name="restaurantSectionInfos" minOccurs="1"\>             	\<xs:complexType\>                 	\<xs:sequence\>                     	\<xs:element name="restaurantSectionInfo" type="idName" minOccurs="0"/\>                 	\</xs:sequence\>             	\</xs:complexType\>         	\</xs:element\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:complexType name="pointOfSaleDto"\>     	\<xs:sequence\>         	\<xs:element name="id" type="xs:string" minOccurs="1"/\>         	\<xs:element name="name" type="xs:string" minOccurs="1"/\>         	\<xs:element name="main" type="xs:boolean" minOccurs="1"/\>         	\<xs:element name="cashRegisterInfo" type="idName" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:complexType name="idName"\>     	\<xs:sequence\>         	\<xs:element name="id" type="xs:string" minOccurs="1"/\>         	\<xs:element name="name" type="xs:string" minOccurs="1"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\> |

## XSD Terminal

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   	\<xs:element name="terminalDto" type="terminalDto"/\>   	\<xs:complexType name="terminalDto"\>     	\<xs:sequence\>         	\<xs:element name="id" type="xs:string" minOccurs="1"/\>         	\<xs:element name="name" type="xs:string" minOccurs="1"/\>         	\<xs:element name="computerName" type="xs:string" minOccurs="0"/\>         	\<xs:element name="anonymous" type="xs:boolean" minOccurs="1"/\>         	\<xs:element name="groupInfo" type="idName" minOccurs="0"/\>         	\<xs:element name="restaurantSectionIds" minOccurs="1"\>             	\<xs:complexType\>                 	\<xs:sequence\>                     	\<xs:element name="i" type="xs:string" minOccurs="0"/\>                 	\</xs:sequence\>             	\</xs:complexType\>         	\</xs:element\>     	\</xs:sequence\> 	\</xs:complexType\>   	\<xs:complexType name="idName"\>     	\<xs:sequence\>         	\<xs:element name="id" type="xs:string" minOccurs="1"/\>         	\<xs:element name="name" type="xs:string" minOccurs="1"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\> |

## XSD Corporation hierarchy

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   	\<xs:element name="corporateItemDto" type="corporateItemDto"/\>   	\<xs:complexType name="corporateItemDto"\>     	\<xs:sequence\>         	\<xs:element name="id" type="xs:string" minOccurs="1"/\>         	\<xs:element name="parentId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="code" type="xs:string" minOccurs="0"/\>         	\<xs:element name="name" type="xs:string" minOccurs="0"/\>         	\<xs:element name="type" type="xs:string" minOccurs="1"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\> |

## 

# Reports

## OLAP-report

| HTTP Method  | GET  |
| :---- | :---- |
| URI | **reports**/**olap** |
| Result | *report structure* |

### Parameters 

| Code | Name code | Description  |
| :---- | :---- | :---- |
| *report* | SALES  TRANSACTIONS  DELIVERIES STOCK | Report type |
| ***groupRow*** | **Grouping fields, for example: groupRow=WaiterName& groupRow=OpenTime** | You can group by field if the value in the Grouping column for the field is true |
| ***groupCol*** | **Fields for highlighting values ​​by columns**  | You can group by field if the value in the Grouping column for the field is true |
| ***agr*** | **Aggregation fields, for example: agr=DishDiscountSum\&agr=VoucherNum** | You can group by field if the value in the Grouping column for the field is true |
| ***from*** | **DD.MM.YYYY**  | Start date |
| ***to*** | **DD.MM.YYYY**  | Final date |

##### Request example

| http://localhost:8080/resto/api/reports/olap?key=ec621550-afae-133e-80c8-76155db2b268\&report=SALES\&from=01.12.2014\&to=18.12.2014\&groupRow=WaiterNam |
| :---- |

## Warehouse activity report

| HTTP Method  | GET |
| :---- | :---- |
| URI | **reports/storeOperations** |
| Result | *storeReportItemDto structure* |

### Parameters 

| Code | Name code | Description  |
| :---- | :---- | :---- |
| *dateFrom* | DD.MM.YYYY  | Date from |
| *dateTo* | DD.MM.YYYY  | Date To |
| *stores* | GUID  | Store |
| *documentTypes* |  | Types of documents to include. If value is null or empty, all documents are included. |
| *productDetalization* | Boolean  | If true, the report includes product information but does not. If false \- the report includes each document of one line and fills in the sums of documents |
| *showCostCorrections* | Boolean   | Whether to enable cost adjustment. This option is available only if you have set a filter by document type. If necessary, the correction is included. |
| *presetId* | GUID  | Preconfigured report ID. If specified, all settings except dates are ignored. |

##### 

##### Request example

| http://localhost:8080/resto/api/reports/storeOperations?key=1ac6b9a3-19a0-7c60-e23b-124dd70d75da\&amp;dateFrom=01.12.2014\&dateTo=17.12.2014\&presetId=bf8886b3-a765-6535-37e4-873bce201482 |
| :---- |

## Warehouse operation report presets

| HTTP Method  | GET |
| :---- | :---- |
| URI | **reports/productExpense** |
| Result | *dayDishValue structure* |

### Parameters 

| Code | Name code | Description  |
| :---- | :---- | :---- |
| *department* | GUID  |  |
| *dateFrom* | DD.MM.YYYY  |  |
| *dateTo* | DD.MM.YYYY  |  |
| *hourFrom* | hh | Starting hour of the sampling interval in days (default \-1, all the time) |
| *hourTo* | hh | Sampling interval end hour in days (default \-1, all the time) |

##### Request example

| http://localhost:8080/resto/api/reports/productExpense?key=1ac6b9a3-19a0-7c60-e23b-124dd70d75da\&department=49023e1b-6e3a-6c33-0133-cce1f6f5000b\&dateFrom=01.12.2014\&dateTo=17.12.2014\&hourFrom=12\&hourTo=15 |
| :---- |

## Sales report

| HTTP Method  | GET |
| :---- | :---- |
| URI  | reports/sales |
| Result | *dayDishValue structure* |

### Parameters 

| Code | Name code | Description  |
| :---- | :---- | :---- |
| *department* | GUID  |  |
| *dateFrom* | DD.MM.YYYY  |  |
| *dateTo* | DD.MM.YYYY  |  |
| *hourFrom* | hh | Starting hour of the sampling interval in days (default \-1, all the time) |
| *hourTo* | hh | Sampling interval end hour in days (default \-1, all the time) |
| *dishDetails* | Boolean | Whether to enable breakdown by dish (true/false), false by default |
| *allRevenue*  | Boolean | Filtering by payment types (true \- all types, false \- only revenue), by default true |

##### Request example

| http://localhost:8080/resto/api/reports/sales?key=1ac6b9a3-19a0-7c60-e23b-124dd70d75da\&department=49023e1b-6e3a-6c33-0133-cce1f6f5000b\&dateFrom=01.12.2014\&dateTo=17.12.2014\&hourFrom=12\&hourTo=15\&dishDetails=true\&allRevenue=false |
| :---- |

## Monthly income plan

| HTTP Method  | GET |
| :---- | :---- |
| URI  | **reports/monthlyIncomePlan** |
| Result | *budgetPlanItemDtoes structure* |

### Parameters 

| Code | Name code |
| :---- | :---- |
| *department* | GUID  |
| *dateFrom* | DD.MM.YYYY |
| *dateTo* | DD.MM.YYYY |

##### Request example

| http://localhost:8080/resto/api/reports/monthlyIncomePlan?key=05e04d9e-26db-a5a2-ba2b-68af4e8a5ed4\&department=49023e1b-6e3a-6c33-0133-cce1f6f5000b\&dateFrom=01.12.2014\&dateTo=18.12.2014 |
| :---- |

## Ingredient entry report

| HTTP Method  | GET |
| :---- | :---- |
| URI  | **reports/**ingredientEntry |
| Result | *ingredientEntryDtoes structure* |

### Parameters 

| Code | Name code | Comment |
| :---- | :---- | :---- |
| *department* | GUID  |  |
| *dateFrom* | DD.MM.YYYY |  |
| *dateTo* | DD.MM.YYYY |  |
| *productArticle* | String | Product SKU  |
| *includeSubtree*  | Boolean | Whether to include subtree rows in the report (default is false) |

##### Request example

| http://localhost:8080/resto/api/reports/ingredientEntry?key=05e04d9e-26db-a5a2-ba2b-68af4e8a5ed4\&date=01.12.2014\&product=2c3ab3e1-266d-4667-b344-98b6c194a305\&department=49023e1b-6e3a-6c33-0133-cce1f6f5000b\&includeSubtree=false |
| :---- |

## XSD Ingredient entry report 

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   \<xs:element name="item" type="ingredientEntryDto"/\>   \<xs:complexType name="ingredientEntryDto"\> 	\<xs:sequence\>     	\<\!-- Gross in base unit of measure (kg)  \--\>   	\<xs:element name="amountInMainUnit" type="xs:decimal" minOccurs="0"/\>     	\<\!-- Gross in product units \--\>   	\<xs:element name="amountInMeasureUnit" type="xs:decimal" minOccurs="0"/\>     	\<\!-- Net in base unit (kg) \--\>   	\<xs:element name="amountMiddleMainUnit" type="xs:decimal" minOccurs="0"/\>     	\<\!-- Net in product units \--\>   	\<xs:element name="amountMiddleMeasureUnit" type="xs:decimal" minOccurs="0"/\>     	\<\!-- Output in base unit (kg) \--\>   	\<xs:element name="amountOutMainUnit" type="xs:decimal" minOccurs="0"/\>     	\<\!-- Output in product units \--\>   	\<xs:element name="amountOutMeasureUnit" type="xs:decimal" minOccurs="0"/\>     	\<\!-- Cold Working Loss (%) \--\>   	\<xs:element name="coldLoss" type="xs:decimal" minOccurs="0"/\>     \<\!-- Percentage of cost, i.e. the percentage that the cost of ingredients is from the cost of the dish \--\>   	\<xs:element name="costNorm" type="xs:decimal" minOccurs="0"/\>     	\<\!-- Dish cost price \--\>   	\<xs:element name="dishCostNorm" type="xs:decimal" minOccurs="0"/\>     	\<\!-- Selling price of the dish \--\>   	\<xs:element name="dishSalePrice" type="xs:decimal" minOccurs="0"/\>     	\<\!-- Hot working loss (%) \--\>   	\<xs:element name="hotLoss" type="xs:decimal" minOccurs="0"/\>     	\<\!-- Report row ID for the tree view (guid) \--\>   	\<xs:element name="itemId" type="xs:string" minOccurs="0"/\>       	\<xs:element name="itemParentId" type="xs:string" minOccurs="0"/\>     	\<\!-- Product name \--\>   	\<xs:element name="name" type="xs:string" minOccurs="0"/\>     	\<\!-- SKU--\>   	\<xs:element name="num" type="xs:string" minOccurs="0"/\>     	\<\!-- Product ID (guid) \--\>   	\<xs:element name="product" type="xs:string" minOccurs="0"/\>     	\<\!-- The cost of goods in a dish \--\>   	\<xs:element name="productInDishCost" type="xs:decimal" minOccurs="0"/\>     	\<\!-- The cost of the product, a report is built around the house \--\>   	\<xs:element name="sourceProductCostNorm" type="xs:decimal" minOccurs="0"/\>   	\<xs:element name="treeLevel" type="xs:int"/\>     	\<\!-- Unit name \--\>   	\<xs:element name="unit" type="xs:string" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\> \</xs:schema\> |

## 

## XSD Sales report

## 

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   \<xs:element name="dayDishValue" type="dayDishValue"/\>   \<xs:complexType name="dayDishValue"\> 	\<xs:sequence\>   	\<xs:element name="date" type="xs:string" minOccurs="0"/\>   	\<xs:element name="productId" type="xs:string" minOccurs="0"/\>   	\<xs:element name="productName" type="xs:string" minOccurs="0"/\>   	\<xs:element name="value" type="xs:decimal" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\> \</xs:schema\> |

## 

## XSD Report on warehouse operations

## 

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   \<xs:element name="storeReportItemDto" type="storeReportItemDto"/\>   \<xs:complexType name="storeReportItemDto"\> 	\<xs:sequence\>   	\<xs:element name="ndsPercent" type="xs:decimal" minOccurs="0"/\>   	\<xs:element name="productCategory" type="xs:string" minOccurs="0"/\>   	\<xs:element name="productGroup" type="xs:string" minOccurs="0"/\>   	\<xs:element name="product" type="xs:string" minOccurs="0"/\>   	\<xs:element name="secondaryAccount" type="xs:string" minOccurs="0"/\>   	\<xs:element name="primaryStore" type="xs:string" minOccurs="0"/\>   	\<xs:element name="documentNum" type="xs:string" minOccurs="0"/\>   	\<xs:element name="expenseAccount" type="xs:string" minOccurs="0"/\>   	\<xs:element name="revenueAccount" type="xs:string" minOccurs="0"/\>   	\<xs:element name="documentComment" type="xs:string" minOccurs="0"/\>   	\<xs:element name="documentId" type="xs:string" minOccurs="0"/\>   	\<xs:element name="documentType" type="documentType" minOccurs="0"/\>   	\<xs:element name="incoming" type="xs:boolean"/\>   	\<xs:element name="type" type="transactionType" minOccurs="0"/\>   	\<xs:element name="date" type="xs:string" minOccurs="0"/\>   	\<xs:element name="operationalDate" type="xs:string" minOccurs="0"/\>   	\<xs:element name="cost" type="xs:decimal" minOccurs="0"/\>   	\<xs:element name="secondEstimatedPurchasePrice" type="xs:decimal" minOccurs="0"/\>   	\<xs:element name="firstEstimatedPurchasePrice" type="xs:decimal" minOccurs="0"/\>   	\<xs:element name="documentSum" type="xs:decimal" minOccurs="0"/\>   	\<xs:element name="secondaryAmount" type="xs:decimal" minOccurs="0"/\>   	\<xs:element name="amount" type="xs:decimal" minOccurs="0"/\>   	\<xs:element name="sumWithoutNds" type="xs:decimal" minOccurs="0"/\>   	\<xs:element name="sumNds" type="xs:decimal" minOccurs="0"/\>   	\<xs:element name="sum" type="xs:decimal" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\>   \<xs:simpleType name="transactionType"\> 	\<xs:restriction base="xs:string"\>   	\<xs:enumeration value="OPENING\_BALANCE"/\>   	\<xs:enumeration value="CUSTOM"/\>   	\<xs:enumeration value="CASH"/\>   	\<xs:enumeration value="PREPAY\_CLOSED"/\>   	\<xs:enumeration value="PREPAY"/\>   	\<xs:enumeration value="PREPAY\_RETURN"/\>   	\<xs:enumeration value="PREPAY\_CLOSED\_RETURN"/\>   	\<xs:enumeration value="DISCOUNT"/\>   	\<xs:enumeration value="CARD"/\>   	\<xs:enumeration value="CREDIT"/\>   	\<xs:enumeration value="PAYIN"/\>   	\<xs:enumeration value="PAYOUT"/\>   	\<xs:enumeration value="PAY\_COLLECTION"/\>   	\<xs:enumeration value="CASH\_CORRECTION"/\>   	\<xs:enumeration value="INVENTORY\_CORRECTION"/\>   	\<xs:enumeration value="STORE\_COST\_CORRECTION"/\>   	\<xs:enumeration value="CASH\_SURPLUS"/\>   	\<xs:enumeration value="CASH\_SHORTAGE"/\>   	\<xs:enumeration value="PENALTY"/\>   	\<xs:enumeration value="BONUS"/\>   	\<xs:enumeration value="INVOICE"/\>   	\<xs:enumeration value="NDS\_INCOMING"/\>   	\<xs:enumeration value="NDS\_SALES"/\>   	\<xs:enumeration value="SALES\_REVENUE"/\>   	\<xs:enumeration value="OUTGOING\_INVOICE"/\>   	\<xs:enumeration value="OUTGOING\_INVOICE\_REVENUE"/\>   	\<xs:enumeration value="RETURNED\_INVOICE"/\>   	\<xs:enumeration value="RETURNED\_INVOICE\_REVENUE"/\>   	\<xs:enumeration value="WRITEOFF"/\>   	\<xs:enumeration value="SESSION\_WRITEOFF"/\>   	\<xs:enumeration value="TRANSFER"/\>   	\<xs:enumeration value="TRANSFORMATION"/\>   	\<xs:enumeration value="TARIFF\_HOUR"/\>   	\<xs:enumeration value="ON\_THE\_HOUSE"/\>   	\<xs:enumeration value="ADVANCE"/\>   	\<xs:enumeration value="INCOMING\_SERVICE"/\>   	\<xs:enumeration value="OUTGOING\_SERVICE"/\>   	\<xs:enumeration value="INCOMING\_SERVICE\_PAYMENT"/\>   	\<xs:enumeration value="OUTGOING\_SERVICE\_PAYMENT"/\>   	\<xs:enumeration value="CLOSE\_AT\_EMPLOYEE\_EXPENSE"/\>   	\<xs:enumeration value="INCENTIVE\_PAYMENT"/\>   	\<xs:enumeration value="TARIFF\_PERCENT"/\>   	\<xs:enumeration value="SESSION\_ACCEPTANCE"/\>   	\<xs:enumeration value="EMPLOYEE\_CASH\_PAYMENT"/\>   	\<xs:enumeration value="EMPLOYEE\_PAYMENT"/\>   	\<xs:enumeration value="INVOICE\_PAYMENT"/\>   	\<xs:enumeration value="OUTGOING\_DOCUMENT\_PAYMENT"/\>   	\<xs:enumeration value="OUTGOING\_SALES\_DOCUMENT\_PAYMENT"/\>   	\<xs:enumeration value="PRODUCTION"/\>   	\<xs:enumeration value="SALES\_RETURN\_PAYMENT"/\>   	\<xs:enumeration value="SALES\_RETURN\_WRITEOFF"/\>   	\<xs:enumeration value="DISASSEMBLE"/\> 	\</xs:restriction\>   \</xs:simpleType\>   \<xs:simpleType name="documentType"\> 	\<xs:restriction base="xs:string"\>   	\<xs:enumeration value="INCOMING\_INVOICE"/\>   	\<xs:enumeration value="INCOMING\_INVENTORY"/\>   	\<xs:enumeration value="INCOMING\_SERVICE"/\>   	\<xs:enumeration value="OUTGOING\_SERVICE"/\>   	\<xs:enumeration value="WRITEOFF\_DOCUMENT"/\>   	\<xs:enumeration value="SALES\_DOCUMENT"/\>   	\<xs:enumeration value="SESSION\_ACCEPTANCE"/\>   	\<xs:enumeration value="INTERNAL\_TRANSFER"/\>   	\<xs:enumeration value="OUTGOING\_INVOICE"/\>   	\<xs:enumeration value="RETURNED\_INVOICE"/\>   	\<xs:enumeration value="PRODUCTION\_DOCUMENT"/\>   	\<xs:enumeration value="TRANSFORMATION\_DOCUMENT"/\>   	\<xs:enumeration value="PRODUCTION\_ORDER"/\>   	\<xs:enumeration value="CONSOLIDATED\_ORDER"/\>   	\<xs:enumeration value="PREPARED\_REGISTER"/\>   	\<xs:enumeration value="MENU\_CHANGE"/\>   	\<xs:enumeration value="PRODUCT\_REPLACEMENT"/\>   	\<xs:enumeration value="SALES\_RETURN\_DOCUMENT"/\>   	\<xs:enumeration value="DISASSEMBLE\_DOCUMENT"/\>   	\<xs:enumeration value="FUEL\_ACCEPTANCE"/\>   	\<xs:enumeration value="FUEL\_GAGING\_DOCUMENT"/\>   	\<xs:enumeration value="PAYROLL"/\> 	\</xs:restriction\>   \</xs:simpleType\> \</xs:schema\> |

## 

## XSD Monthly income plan

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   \<xs:element name="budgetPlanItemDto" type="budgetPlanItemDto"/\>   \<xs:complexType name="budgetPlanItemDto"\> 	\<xs:sequence\>   	\<xs:element name="date" type="xs:string" minOccurs="0"/\>   	\<xs:element name="planValue" type="xs:decimal" minOccurs="0"/\>   	\<xs:element name="valueType" type="budgetPlanItemValueType" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\>   \<xs:simpleType name="budgetPlanItemValueType"\> 	\<xs:restriction base="xs:string"\>   	\<xs:enumeration value="ABSOLUTE"/\>   	\<xs:enumeration value="PERCENT"/\>   	\<xs:enumeration value="AUTOMATIC"/\> 	\</xs:restriction\>   \</xs:simpleType\> \</xs:schema\> |

## XSD Warehouse operation report presets

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   \<xs:element name="storeReportPreset" type="storeReportPreset"/\>   \<xs:complexType name="storeReportPreset"\> 	\<xs:sequence\>   	\<xs:element name="id" type="xs:string" minOccurs="0"/\>   	\<xs:element name="defaultReport" type="xs:boolean"/\>   	\<xs:element name="name" type="xs:string" minOccurs="0"/\>   	\<xs:element name="comment" type="xs:string" minOccurs="0"/\>   	\<xs:element name="grouping" type="storeOperationsReportGrouping" minOccurs="0"/\>   	\<xs:element name="filter" type="filter" minOccurs="0"/\>   	\<xs:element name="columnCaptions" minOccurs="0"\>     	\<xs:complexType\>       	\<xs:sequence\>         	\<xs:element name="i" type="keyValue" minOccurs="0" maxOccurs="unbounded"/\>       	\</xs:sequence\>     	\</xs:complexType\>   	\</xs:element\> 	\</xs:sequence\>   \</xs:complexType\>   \<xs:complexType name="storeOperationsReportGrouping"\> 	\<xs:sequence\>   	\<xs:element name="dateDetalization" type="dateDetalization" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\>   \<xs:complexType name="filter"\> 	\<xs:sequence\>   	\<xs:element name="primaryStores" minOccurs="0"\>     	\<xs:complexType\>       	\<xs:sequence\>         	\<xs:element name="i" type="xs:string" minOccurs="0" maxOccurs="unbounded"/\>       	\</xs:sequence\>     	\</xs:complexType\>   	\</xs:element\>   	\<xs:element name="secondaryAccounts" minOccurs="0"\>     	\<xs:complexType\>       	\<xs:sequence\>         	\<xs:element name="i" type="xs:string" minOccurs="0" maxOccurs="unbounded"/\>       	\</xs:sequence\>     	\</xs:complexType\>   	\</xs:element\>   	\<xs:element name="counteragents" minOccurs="0"\>     	\<xs:complexType\>       	\<xs:sequence\>         	\<xs:element name="i" type="xs:string" minOccurs="0" maxOccurs="unbounded"/\>       	\</xs:sequence\>     	\</xs:complexType\>   	\</xs:element\>   	\<xs:element name="products" minOccurs="0"\>     	\<xs:complexType\>       	\<xs:sequence\>         	\<xs:element name="i" type="xs:string" minOccurs="0" maxOccurs="unbounded"/\>       	\</xs:sequence\>     	\</xs:complexType\>   	\</xs:element\>   	\<xs:element name="secondaryProducts" minOccurs="0"\>     	\<xs:complexType\>       	\<xs:sequence\>         	\<xs:element name="i" type="xs:string" minOccurs="0" maxOccurs="unbounded"/\>       	\</xs:sequence\>     	\</xs:complexType\>   	\</xs:element\>   	\<xs:element name="transactionTypes" minOccurs="0"\>     	\<xs:complexType\>       	\<xs:sequence\>         	\<xs:element name="i" type="transactionType" minOccurs="0" maxOccurs="unbounded"/\>       	\</xs:sequence\>     	\</xs:complexType\>   	\</xs:element\>   	\<xs:element name="documentTypes" minOccurs="0"\>     	\<xs:complexType\>       	\<xs:sequence\>         	\<xs:element name="i" type="documentType" minOccurs="0" maxOccurs="unbounded"/\>       	\</xs:sequence\>     	\</xs:complexType\>   	\</xs:element\>   	\<xs:element name="dataDirection" type="storeDataDirection" minOccurs="0"/\>   	\<xs:element name="includeZeroAmountAndSum" type="xs:boolean"/\> 	\</xs:sequence\>   \</xs:complexType\>   \<xs:complexType name="keyValue"\> 	\<xs:sequence\>   	\<xs:element name="k" type="xs:string" minOccurs="0"/\>   	\<xs:element name="v" type="xs:string" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\>   \<xs:simpleType name="dateDetalization"\> 	\<xs:restriction base="xs:string"\>   	\<xs:enumeration value="DAY"/\>   	\<xs:enumeration value="YEAR"/\>   	\<xs:enumeration value="MONTH"/\>   	\<xs:enumeration value="WEEK"/\>   	\<xs:enumeration value="HALF\_MONTH"/\>   	\<xs:enumeration value="TOTAL\_ONLY"/\>   	\<xs:enumeration value="QUARTER"/\> 	\</xs:restriction\>   \</xs:simpleType\>   \<xs:simpleType name="transactionType"\> 	\<xs:restriction base="xs:string"\>   	\<xs:enumeration value="SESSION\_WRITEOFF"/\>   	\<xs:enumeration value="OUTGOING\_SALES\_DOCUMENT\_PAYMENT"/\>   	\<xs:enumeration value="PREPAY\_CLOSED"/\>   	\<xs:enumeration value="CASH\_SURPLUS"/\>   	\<xs:enumeration value="RETURNED\_INVOICE"/\>   	\<xs:enumeration value="CREDIT"/\>   	\<xs:enumeration value="CASH\_SHORTAGE"/\>   	\<xs:enumeration value="OUTGOING\_SERVICE"/\>   	\<xs:enumeration value="STORE\_COST\_CORRECTION"/\>   	\<xs:enumeration value="SALES\_REVENUE"/\>   	\<xs:enumeration value="ADVANCE"/\>   	\<xs:enumeration value="PAYOUT"/\>   	\<xs:enumeration value="INVOICE\_PAYMENT"/\>   	\<xs:enumeration value="OUTGOING\_DOCUMENT\_PAYMENT"/\>   	\<xs:enumeration value="TARIFF\_HOUR"/\>   	\<xs:enumeration value="TRANSFER"/\>   	\<xs:enumeration value="WRITEOFF"/\>   	\<xs:enumeration value="SALES\_RETURN\_WRITEOFF"/\>   	\<xs:enumeration value="CARD"/\>   	\<xs:enumeration value="PREPAY\_CLOSED\_RETURN"/\>   	\<xs:enumeration value="PRODUCTION"/\>   	\<xs:enumeration value="EMPLOYEE\_CASH\_PAYMENT"/\>   	\<xs:enumeration value="DISCOUNT"/\>   	\<xs:enumeration value="OUTGOING\_INVOICE"/\>   	\<xs:enumeration value="INVENTORY\_CORRECTION"/\>   	\<xs:enumeration value="IMPORTED\_BANK\_STATEMENT"/\>   	\<xs:enumeration value="INCENTIVE\_PAYMENT"/\>   	\<xs:enumeration value="NDS\_INCOMING"/\>   	\<xs:enumeration value="DISASSEMBLE"/\>   	\<xs:enumeration value="CASH"/\>   	\<xs:enumeration value="OPENING\_BALANCE"/\>   	\<xs:enumeration value="INCOMING\_SERVICE"/\>   	\<xs:enumeration value="TRANSFORMATION"/\>   	\<xs:enumeration value="BONUS"/\>   	\<xs:enumeration value="SESSION\_ACCEPTANCE"/\>   	\<xs:enumeration value="PREPAY\_RETURN"/\>   	\<xs:enumeration value="ON\_THE\_HOUSE"/\>   	\<xs:enumeration value="EMPLOYEE\_PAYMENT"/\>   	\<xs:enumeration value="SALES\_RETURN\_PAYMENT"/\>   	\<xs:enumeration value="INVOICE"/\>   	\<xs:enumeration value="PENALTY"/\>   	\<xs:enumeration value="OUTGOING\_SERVICE\_PAYMENT"/\>   	\<xs:enumeration value="CLOSE\_AT\_EMPLOYEE\_EXPENSE"/\>   	\<xs:enumeration value="PAY\_COLLECTION"/\>   	\<xs:enumeration value="TARIFF\_PERCENT"/\>   	\<xs:enumeration value="INCOMING\_SERVICE\_PAYMENT"/\>   	\<xs:enumeration value="PAYIN"/\>   	\<xs:enumeration value="RETURNED\_INVOICE\_REVENUE"/\>   	\<xs:enumeration value="NDS\_SALES"/\>   	\<xs:enumeration value="OUTGOING\_INVOICE\_REVENUE"/\>   	\<xs:enumeration value="PREPAY"/\>   	\<xs:enumeration value="CUSTOM"/\>   	\<xs:enumeration value="CASH\_CORRECTION"/\> 	\</xs:restriction\>   \</xs:simpleType\>   \<xs:simpleType name="documentType"\> 	\<xs:restriction base="xs:string"\>   	\<xs:enumeration value="INCOMING\_INVOICE"/\>   	\<xs:enumeration value="INTERNAL\_TRANSFER"/\>   	\<xs:enumeration value="TRANSFORMATION\_DOCUMENT"/\>   	\<xs:enumeration value="PAYROLL"/\>   	\<xs:enumeration value="DISASSEMBLE\_DOCUMENT"/\>   	\<xs:enumeration value="OUTGOING\_INVOICE"/\>   	\<xs:enumeration value="MENU\_CHANGE"/\>   	\<xs:enumeration value="OUTGOING\_CASH\_ORDER"/\>   	\<xs:enumeration value="PREPARED\_REGISTER"/\>   	\<xs:enumeration value="SALES\_RETURN\_DOCUMENT"/\>   	\<xs:enumeration value="INCOMING\_CASH\_ORDER"/\>   	\<xs:enumeration value="SALES\_DOCUMENT"/\>   	\<xs:enumeration value="WRITEOFF\_DOCUMENT"/\>   	\<xs:enumeration value="PRODUCTION\_ORDER"/\>   	\<xs:enumeration value="FUEL\_ACCEPTANCE"/\>   	\<xs:enumeration value="PRODUCTION\_DOCUMENT"/\>   	\<xs:enumeration value="PRODUCT\_REPLACEMENT"/\>   	\<xs:enumeration value="SESSION\_ACCEPTANCE"/\>   	\<xs:enumeration value="RETURNED\_INVOICE"/\>   	\<xs:enumeration value="INCOMING\_SERVICE"/\>   	\<xs:enumeration value="FUEL\_GAGING\_DOCUMENT"/\>   	\<xs:enumeration value="CONSOLIDATED\_ORDER"/\>   	\<xs:enumeration value="OUTGOING\_SERVICE"/\>   	\<xs:enumeration value="INCOMING\_INVENTORY"/\> 	\</xs:restriction\>   \</xs:simpleType\>   \<xs:simpleType name="storeDataDirection"\> 	\<xs:restriction base="xs:string"\>   	\<xs:enumeration value="IN"/\>   	\<xs:enumeration value="INOUT"/\>   	\<xs:enumeration value="OUT"/\> 	\</xs:restriction\>   \</xs:simpleType\> \</xs:schema\> |

## XSD Warehouse operation report presets

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   \<xs:element name="dayDishValue" type="dayDishValue"/\>   \<xs:complexType name="dayDishValue"\> 	\<xs:sequence\>   	\<xs:element name="date" type="xs:string" minOccurs="0"/\>   	\<xs:element name="productId" type="xs:string" minOccurs="0"/\>   	\<xs:element name="productName" type="xs:string" minOccurs="0"/\>   	\<xs:element name="value" type="xs:decimal" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\> \</xs:schema\> |

## Lines OLAP-report by Delivery

| Name | Aggregation | Grouping | Filtering | Type | Value |
| :---- | :---- | :---- | :---- | :---- | :---- |
| CloseTime  | false  | true | true | DATETIME |  |
| Delivery.ActualTime  | false  | true | true | DATETIME |  |
| Delivery.Address  | false  | true | true | STRING  |  |
| Delivery.BillTime  | false  | true | true | DATETIME |  |
| Delivery.CancelCause  | false  | true | true | STRING  |  |
| Delivery.City  | false  | true | true | STRING  |  |
| Delivery.CloseTime  | false  | true | true | DATETIME |  |
| Delivery.CookingToSendDuration  | true | false  | false  | INTEGER |  |
| Delivery.Courier | false  | true | true | STRING |  |
| Delivery.CustomerCardNumber  | false  | true | true | STRING  |  |
| Delivery.CustomerCardType  | false  | true | true | STRING |  |
| Delivery.CustomerComment  | false  | true | true | STRING |  |
| Delivery.CustomerCreatedDate  | false  | true | true | STRING  |  |
| Delivery.CustomerCreatedDateTyped | false  | true | true | DATE  |  |
| Delivery.CustomerMarketingSource  | false  | true | true | STRING  |  |
| Delivery.CustomerName  | false  | true | true | STRING  |  |
| Delivery.Delay  | false  | true | true | INTEGER |  |
| Delivery.DelayAvg  | false  | false  | false  | AMOUNT  |  |
| Delivery.DeliveryComment  | false  | true | true | STRING  |  |
| Delivery.DeliveryOperator  | false  | true | true | STRING  |  |
| Delivery.Email  | false  | true | true | STRING  |  |
| Delivery.ExpectedTime  | false  | true | true | DATETIME |  |
| Delivery.MarketingSource  | false  | true | true | STRING |  |
| Delivery.Number  | false  | true | true | INTEGER  |  |
| Delivery.Phone  | false  | true | true | STRING |  |
| Delivery.PrintTime  | false  | true | true | DATETIME  |  |
| Delivery.Region  | false  | true | true | STRING  |  |
| Delivery.SendTime  | false  | true | true | DATETIME  |  |
| Delivery.ServiceType  | false  | true | true | ENUM  | PICKUP COURIER  |
| Delivery.SourceKey  | false  | true | true | STRING  |  |
| Delivery.Street  | false  | true | true | STRING  |  |
| Delivery.WayDuration  | false  | true | true | INTEGER |  |
| Delivery.WayDurationAvg  | true | false  | false  | AMOUNT |  |
| Delivery.WayDurationSum  | true | false  | false  | INTEGER |  |
| DishServicePrintTime.Max  | true | false  | false  | INTEGER |  |

## Lines OLAP-report by transactions

## 

| Name  | Aggregation | Grouping | Filtering  | Type  |
| :---- | :---- | :---- | :---- | :---- |
| Account.AccountHierarchyFull  | false | true  | true  | STRING  |
| Account.AccountHierarchySecond | false | true  | true  | STRING  |
| Account.AccountHierarchyThird  | false | true  | true  | STRING  |
| Account.AccountHierarchyTop  | false | true  | true  | STRING  |
| Account.Code  | false | true  | true  | STRING  |
| Account.CounteragentType  | false | true  | true  | ENUM |
| Account.Group  | false | true  | true  | ENUM |
| Account.IsCashFlowAccount  | false | true  | true  | ENUM |
| Account.Name  | false | true  | true  | STRING  |
| Account.StoreOrAccount  | false | true  | true  | ENUM |
| Account.Type  | false | true  | true  | ENUM |
| Amount | true  | false | false | AMOUNT |
| Amount.In  | true  | false | false | AMOUNT |
| Amount.Out  | true  | false | false | AMOUNT |
| Amount.StoreInOut | true  | false | false | STRING |
| Amount.StoreInOut | true  | false | false | AMOUNT |
| CashFlowCategory  | false  | true  | true  | STRING |
| CashFlowCategory.Hierarchy  | false  | true  | true  | STRING |
| CashFlowCategory.HierarchyLevel1  | false  | true  | true  | STRING |
| CashFlowCategory.HierarchyLevel2  | false  | true  | true  | STRING |
| CashFlowCategory.HierarchyLevel3  | false  | true  | true  | STRING |
| CashFlowCategory.Type  | false  | true  | true  | ENUM |
| Comment  | false  | true  | true  | STRING |
| Conception  | false  | true  | true  | STRING |
| Conception.Code  | false  | true  | true  | STRING |
| Contr-Account.Code  | false  | true  | true  | STRING |
| Contr-Account.Group  | false  | true  | true  | ENUM |
| Contr-Account.Name  | false  | true  | true  | STRING |
| Contr-Account.Type  | false  | true  | true  | ENUM |
| Contr-Amount | false  | false | false | AMOUNT |
| Contr-Product.AccountingCategory  | true | true  | true  | STRING |
| Contr-Product.AlcoholClass  | false  | true  | true  | STRING |
| Contr-Product.AlcoholClass.Code  | false  | true  | true  | STRING |
| Contr-Product.AlcoholClass.Group  | false  | true  | true  | STRING |
| Contr-Product.AlcoholClass.Type  | false  | true  | true  | ENUM |
| Contr-Product.Category | false  | true  | true  | STRING |
| Contr-Product.CookingPlaceType  | false  | true  | true  | STRING |
| Contr-Product.Hierarchy  | false  | true  | true  | STRING |
| Contr-Product.MeasureUnit  | false  | true  | true  | STRING |
| Contr-Product.Name | false  | true  | true  | STRING |
| Contr-Product.Num | false  | true  | true  | STRING |
| Contr-Product.SecondParent  | false  | true  | true  | STRING |
| Contr-Product.ThirdParent  | false  | true  | true  | STRING |
| Contr-Product.TopParent  | false  | true  | true  | STRING |
| Contr-Product.Type  | false  | true  | true  | ENUM  |
| Counteragent.Name  | false  | true  | true  | STRING |
| DateTime | false  | true  | true  | STRING |
| DateTime.Typed | false  | true  | true  | DATETIME  |
| DateTime.Date | false  | true  | true  | STRING  |
| DateTime.DateTyped  | false  | true  | true  | DATE  |
| DateTime.DayOfWeak  | false  | true  | true  | STRING  |
| DateTime.Hour  | false  | true  | true  | STRING  |
| DateTime.Month  | false  | true  | true  | STRING  |
| DateTime.Year  | false  | true  | true  | STRING  |
| Department  | false  | true  | true  | STRING  |
| Department.Category1  | false  | true  | true  | STRING  |
| Department.Category2  | false  | true  | true  | STRING  |
| Department.Category3  | false  | true  | true  | STRING  |
| Department.Category4  | false  | true  | true  | STRING  |
| Department.Category5  | false  | true  | true  | STRING  |
| Department.Code  | false  | true  | true  | STRING  |
| Department.JurPerson  | false  | true  | true  | STRING  |
| Document  | false  | true  | true  | STRING  |
| FinalBalance.Amount  | true  | false | false | AMOUNT  |
| FinalBalance.Money  | true  | false | false | MONEY |
| PercentOfSummary.ByCol  | true  | false | false | PERCENT  |
| PercentOfSummary.ByRow  | true  | false | false | PERCENT  |
| Product.AccountingCategory  | false  | true  | true  | STRING  |
| Product.AlcoholClass  | false  | true  | true  | STRING  |
| Product.AlcoholClass.Code  | false  | true  | true  | STRING  |
| Product.AlcoholClass.Group  | false  | true  | true  | STRING  |
| Product.AlcoholClass.Type  | false  | true  | true  | ENUM |
| Product.AvgSum  | true  | false | false | MONEY |
| Product.Category  | false  | true | true | STRING |
| Product.CookingPlaceType  | false  | true | true | STRING |
| Product.Hierarchy  | false  | true | true | STRING |
| Product.MeasureUnit  | false  | true | true | STRING |
| Product.Name  | false  | true | true | STRING |
| Product.Num  | false  | true | true | STRING |
| Product.SecondParent  | false  | true | true | STRING |
| Product.ThirdParent  | false  | true | true | STRING |
| Product.TopParent  | false  | true | true | STRING |
| Product.Type  | false  | true | true | ENUM |
| Session.CashRegister | false  | true | true | STRING |
| Session.Group  | false  | true | true | STRING |
| Session.RestaurantSection  | false  | true | true | STRING |
| StartBalance.Amount  | true | false | false | AMOUNT  |
| StartBalance.Money  | true | false | false | MONEY |
| Store  | false | true | true | STRING  |
| Sum.Incoming  | true | false | false | MONEY  |
| Sum.Outgoing  | true | false | false | MONEY  |
| Sum.PartOfIncome  | true | false | false | PERCENT  |
| Sum.PartOfSummaryByCol  | true | false | false | PERCENT  |
| Sum.PartOfSummaryByRow  | true | false | false | PERCENT  |
| Sum.PartOfTotalIncome  | true | false | false | PERCENT  |
| Sum.ResignedSum  | true | false | false | MONEY |
| TransactionSide  | false | true | true | ENUM |
| TransactionType  | false | true | true | ENUM |
| TransactionType.Code  | false | true | true | OBJECT  |

## Lines OLAP-report by sales

| Name | Description Eng | Aggregation | Grouping | Filtering | Type |
| ----- | ----- | ----- | ----- | ----- | ----- |
| AuthUser | Authorised by | false | true | true | STRING |
| Banquet | Banquet | false | true | true | ENUM |
| Bonus.CardNumber | Bonus card number | false | true | true | STRING |
| Bonus.Sum | Bonus amount | true | false | false | MONEY |
| Bonus.Type | Bonus type | false | true | true | STRING |
| Card | Authorisation card | false | true | true | STRING |
| CardNumber | Pay card type | false | true | true | STRING |
| CardOwner | Guest cardholder | false | true | true | STRING |
| CardType | Credit card | false | true | true | STRING |
| Cashier | Cashier | false | true | true | STRING |
| CashLocation | Cash register location | false | true | true | STRING |
| CashRegisterName | Cash register | false | true | true | STRING |
| CloseTime | Closing time | false | true | true | DATETIME |
| Comment | Item comment | false | true | true | STRING |
| Conception | Concept | false | true | true | STRING |
| CookingPlace | Production place | false | true | true | STRING |
| CreditUser | Credited to... | false | true | true | STRING |
| DayOfWeekOpen | Day of week | false | true | true | STRING |
| DeletedWithWriteoff | Item deleted | false | true | true | ENUM |
| DeletionComment | Item deletion comment | false | true | true | STRING |
| Delivery.IsDelivery | Delivery | false | true | true | ENUM |
| Department | Outlet | false | true | true | STRING |
| DiscountPercent | Discount rate | true | true | true | PERCENT |
| DiscountSum | Discount amount | true | false | true | MONEY |
| discountWithoutVAT | Discount amount excl. VAT not included in the cost | true | false | true | MONEY |
| DishAmountInt | Number of items | true | true | true | AMOUNT |
| DishCategory | Item category | false | true | true | STRING |
| DishCode | Item code | false | true | true | STRING |
| DishCode.Quick | Item quick code | false | true | true | STRING |
| DishDiscountSumInt | Amount with discount | true | false | false | MONEY |
| DishDiscountSumInt.average | Average bill amount | true | false | false | MONEY |
| DishDiscountSumInt.averageByGuest | Average revenue per guest | true | false | false | MONEY |
| DishDiscountSumInt.averagePrice | Average price (VAT exclusive) | true | false | false | MONEY |
| DishDiscountSumInt.withoutVAT | Amount with discount VAT exclusive | true | false | false | MONEY |
| DishForeignName | Item name in a foreign language | false | true | true | STRING |
| DishFullName | Full name of the item | false | true | true | STRING |
| DishGroup | Item group | false | true | true | STRING |
| DishGroup.Hierarchy | Item hierarchy | false | true | true | STRING |
| DishGroup.Num | Item group code | false | true | true | STRING |
| DishGroup.SecondParent | Level 2 item group | false | true | true | STRING |
| DishGroup.ThirdParent | Level 3 item group | false | true | true | STRING |
| DishGroup.TopParent | Level 1 item group | false | true | true | STRING |
| DishMeasureUnit | Measurement unit | false | true | true | STRING |
| DishName | Item | false | true | true | STRING |
| DishReturnSum | Void amount | true | true | true | MONEY |
| DishServicePrintTime | Service printing item | false | true | true | DATETIME |
| DishServicePrintTime.Max | Service printing latest item | true | false | false | DATETIME |
| DishServicePrintTime.OpenToLastPrintDuration | Duration: open latest serv. print. | true | false | false | INTEGER |
| DishSumInt | Amount without discount | true | false | false | MONEY |
| DishType | Stock list type | false | true | true | ENUM |
| fullSum | Amount excl. VAT not included in the cost | true | false | true | MONEY |
| GuestNum | Number of guests | true | true | true | AMOUNT |
| GuestNum.Avg | AvgNumber of guests per receipt | true | false | false | AMOUNT |
| HourClose | Closing hour | false | true | true | STRING |
| HourOpen | Opening hour | false | true | true | STRING |
| IncentiveSumBase.Sum | Incentive payment | true | false | false | MONEY |
| IncreasePercent | Surcharge rate | true | true | true | PERCENT |
| IncreaseSum | Surcharge amount | true | true | true | MONEY |
| JurName | Legal entity | false | true | true | STRING |
| Mounth | Month | false | true | true | STRING |
| NonCashPaymentType | Non-cash payment type | false | true | true | STRING |
| NonCashPaymentType.DocumentType | Document type | false | true | true | ENUM |
| OpenDate (до версии 4.2; в 4.2+ deprecated, заменено на OpenDate.Typed) |   | false | true | true | STRING |
| OpenDate.Typed (4.2+) |   | false | true | true | DATE |
| OpenTime | Opening time | false | true | true | DATETIME |
| OperationType | Operation | false | true | true | ENUM |
| OrderDeleted | Order deleted | false | true | true | ENUM |
| OrderDiscount.GuestCard | Guest card | false | true | true | STRING |
| OrderDiscount.Type | Discount type | false | true | true | STRING |
| OrderIncrease.Type | Type of surcharge | false | true | true | STRING |
| OrderItems | Order items | true | false | false | INTEGER |
| OrderNum | Receipt number | true | true | true | INTEGER |
| OrderTime.AverageOrderTime | AvgServing time (min) | true | false | false | AMOUNT |
| OrderTime.AveragePrechequeTime | Avg time in guest bill (min) | true | false | false | AMOUNT |
| OrderTime.OrderLength | Serving time (min) | false | true | true | INTEGER |
| OrderTime.OrderLengthSum | Serving time (min) | true | false | false | INTEGER |
| OrderTime.PrechequeLength | Time in guest bill (min) | false | true | true | INTEGER |
| OrderType | Order type | false | true | true | STRING |
| OrderWaiter.Name | Waiter for the order | false | true | true | STRING |
| OriginName | Order origin | false | true | true | STRING |
| PayTypes | Payment type | false | true | true | STRING |
| PayTypes.Combo | Payment type (comb.) | false | true | true | STRING |
| PayTypes.Group | Payment group | false | true | true | ENUM |
| PayTypes.IsPrintCheque | Fisc. payment type | false | true | true | ENUM |
| PayTypes.VoucherNum | Number of vouchers | true | false | false | INTEGER |
| PercentOfSummary.ByCol | % by column | true | false | false | PERCENT |
| PercentOfSummary.ByRow | % by row | true | false | false | PERCENT |
| PrechequeTime | Guest bill time | false | true | true | DATETIME |
| PriceCategory | Customer price category | false | true | true | STRING |
| PriceCategoryCard | Price Category Card Number | false | true | true | STRING |
| PriceCategoryDiscountCardOwner | Price Category Cardholder | false | true | true | STRING |
| PriceCategoryUserCardOwner | Price Category Card Owner | false | true | true | STRING |
| ProductCostBase.MarkUp | Markup (%) | true | false | false | PERCENT |
| ProductCostBase.OneItem | Cost per unit | true | false | false | MONEY |
| ProductCostBase.Percent | Cost(%) | true | false | false | PERCENT |
| ProductCostBase.ProductCost | Cost | true | false | false | MONEY |
| ProductCostBase.Profit | Markup | true | false | false | MONEY |
| RemovalType | Reason for item deletion | false | true | true | STRING |
| RestaurantSection | Room | false | true | true | STRING |
| RestorauntGroup | Group | false | true | true | STRING |
| SessionNum | Shift number | false | true | true | INTEGER |
| SoldWithDish | Sold with item | false | true | true | STRING |
| Store.Name | From storage | false | true | true | STRING |
| StoreTo | To storage | false | true | true | STRING |
| Storned | Void receipt | false | true | true | ENUM |
| sumAfterDiscountWithoutVAT | Amount with discount excl. VAT not included in the cost | true | false | true | MONEY |
| TableNumInt (до 5.1; в 5.1+ заменено на TableNum) |   | false | true | true | STRING |
| TableNum (5.1+) |   | false | true | true | INTEGER |
| UniqOrderId | Orders | true | false | false | INTEGER |
| UniqOrderId.OrdersCount | Orders | true | false | false | AMOUNT |
| VAT.Percent | VAT(%) | true | true | true | PERCENT |
| VAT.Sum | VAT by bill (Amount) | true | true | true | MONEY |
| WaiterName | Item waiter | false | true | true | STRING |
| WriteoffReason | Write-off reason | false | true | true | STRING |
| WriteoffUser | Written off to employee | false | true | true | STRING |
| YearOpen | Year | false | true | true | STRING |

# Delivery Report

## GET reports/delivery/consolidated

| Parameters |  |
| :---- | :---- |
| *department* | Id department  |
| *dateFrom* | Report start date (DD.MM.YYYY or YYYY-MM-DD) |
| *dateTo* | End date of the report |
| *writeoffAccounts* | List of debit accounts (code or ID) |
| Request  | http://localhost:9080/resto/api/reports/delivery/consolidated?department={code="5"}\&dateFrom=01.04.2014\&dateTo=30.04.2014\&writeoffAccounts={code="5.14"}\&writeoffAccounts={code="5.13"}\&key=cd8cf2c7-a0a2-8b82-b29a-f4f9bf74e5c2 |
| Result | \<report\> \<rows\> \<row\> \<\!--Average check--\> \<avgReceipt\>486.25\</avgReceipt\> \<\!--Date--\> \<date\>01.04.2014\</date\> \<\!--Item amount--\> \<dishAmount\>468.00\</dishAmount\> \<dishAmountPerOrder\>2.23\</dishAmountPerOrder\> \<\!--Order amount--\> \<orderCount\>210.00\</orderCount\> \<\!--Orders "courier"--\> \<orderCountCourier\>65.00\</orderCountCourier\> \<\!--orders "to go"--\> \<orderCountPickup\>145.00\</orderCountPickup\> \<\!--% Budget Complete--\> \<planExecutionPercent\>91.00\</planExecutionPercent\> \<\!--% write-off--\> \<ratioCostWriteoff\>22.10\</ratioCostWriteoff\> \<\!--revenue--\> \<revenue\>102113.00\</revenue\>  \</row\> \</rows\> \</report\> |

## GET reports/delivery/couriers

| Parameters |  |
| :---- | :---- |
| *department* | Id department  |
| *dateFrom* | Report start date (DD.MM.YYYY or YYYY-MM-DD) |
| *dateTo* | End date of the report |
| *targetCommonTime* | Target value of the total time, min. (default \- 30 min.) |
| *targetOnTheWayTime* | Target value of travel time, min. (default \- 0 min.) |
| *targetDoubledOrders* | Target number of double orders per day, pcs. (default \- 0 min.) |
| *targetTripledOrders* | Target number of built orders per day, pcs. (default \- 0 min.) |
| *targetTotalOrders* | Target number of orders per day, pcs (default \- 0 min.) |
| Request  | localhost:9080/resto/api/reports/delivery/couriers?department={code="5"}\&dateFrom=01.04.2014\&dateTo=30.04.2014\&targetCommonTime=5\&targetOnTheWayTime=6\&targetDoubledOrders=7\&targetTripledOrders=8\&targetTotalOrders=9\&key=d34ab6bd-1515-f22e-d02d-92d2a682a512 |
| Result | \<report\>\<rows\>\<row\> \<courier\>Courier\</courier\> \<metrics\>\<metric\>\<doubledOrders\>0.00\</doubledOrders\>\<\!--type of metric (AVERAGE \- average, TARGET \- relation to target indicators, MAXIMUM \- maximum value)--\> \<metricType\>AVERAGE\</metricType\>\<\!--travel time--\>\<onTheWayTime\>0.00\</onTheWayTime\>\<orderCount\>1.00\</orderCount\>\<\!--total time--\>\<totalTime\>34.00\</totalTime\>\<\!--built orders--\>\<tripledOrders\>0.00\</tripledOrders\>\</metric\>\<metric\>\<doubledOrders\>100.00\</doubledOrders\>\<metricType\>TARGET\</metricType\>\<onTheWayTime\>100.00\</onTheWayTime\>\<orderCount\>0.00\</orderCount\>\<totalTime\>0.00\</totalTime\>\<tripledOrders\>100.00\</tripledOrders\>\</metric\>\<metric\>\<doubledOrders\>0.00\</doubledOrders\>\<metricType\>MAXIMUM\</metricType\>\<onTheWayTime\>0.00\</onTheWayTime\>\<orderCount\>1.00\</orderCount\>\<totalTime\>34.00\</totalTime\>\<tripledOrders\>0.00\</tripledOrders\>\</metric\>\</metrics\>\</row\> \<report\>  |

## GET reports/delivery/orderCycle

| Parameters |  |
| :---- | :---- |
| *department* | Id department  |
| *dateFrom* | Report start date (DD.MM.YYYY or YYYY-MM-DD) |
| *dateTo* | End date of the report |
| *targetPizzaTime* | Target time on the table Pizza (default \- 0 min.) |
| *targetCuttingTime* | Target time on the slicing table (default is 0 min.) |
| *targetOnShelfTime* | Efficiency shelf time target (default is 0 min.) |
| *targetInRestaurantTime* | Restaurant time target (default is 0 minutes) |
| *targetOnTheWayTime* | Drive time target (default is 0 minutes) |
| *targetTotalTime* | Target value of the total delivery time (default \- 0 min.) |
| Request  | http://localhost:9080/resto/api/reports/delivery/orderCycle?department={code="5"}\&dateFrom=01.04.2014\&dateTo=30.04.2014\&targetPizzaTime=5\&targetCuttingTime=6\&targetOnShelfTime=7\&targetInRestaurantTime=8\&targetOnTheWayTime=9\&targetTotalTime=10\&key=a113485b-d4f1-0856-8faf-50ba913f04eb |
| Result | \<report\> \<rows\> \<row\> \<\!--time on cutting table--\> \<cuttingTime\>0.00\</cuttingTime\> \<\!--restaurant time--\> \<inRestaurantTime\>15.90\</inRestaurantTime\> \<\!--time on the responsiveness rack--\> \<onShelfTime\>3.72\</onShelfTime\> \<\!--travel time--\> \<onTheWayTime\>8.22\</onTheWayTime\> \<\!--time on the table Pizza--\> \<pizzaTime\>0.00\</pizzaTime\> \<\!--total time--\> \<totalTime\>26.61\</totalTime\> \<\!--type of metric (AVERAGE \- average, TARGET \- relation to target indicators, MAXIMUM \- maximum value)--\> \<metricType\>AVERAGE\</metricType\> \</row\> \</rows\> \</report\> |

## GET reports/delivery/halfHourDetailed

| Parameters |  |
| :---- | :---- |
| *department* | Id department  |
| *dateFrom* | Report start date (DD.MM.YYYY or YYYY-MM-DD) |
| *dateTo* | End date of the report |
| Request  | localhost:9080/resto/api/reports/delivery/halfHourDetailed?department={code="5"}\&dateFrom=01.04.2014\&dateTo=30.04.2014\&key=d34ab6bd-1515-f22e-d02d-92d2a682a512 |
| Result | \<report\> \<rows\> \<row\> \<\!--time (every half hour)--\> \<halfHourDate\>01.04.2014 10:00\</halfHourDate\> \<metrics\> \<metric\> \<\!--average number of dishes per check--\> \<avgDishAmountPerReceipt\>3.500\</avgDishAmountPerReceipt\> \<\!--average check--\> \<avgReceipt\>635.00\</avgReceipt\> \<\!--delivery type--\> \<deliveryType\>COURIER\</deliveryType\> \<dishAmount\>7.000\</dishAmount\> \<orderCount\>2.00\</orderCount\> \</metric\> \<metric\> \<avgDishAmountPerReceipt\>3.000\</avgDishAmountPerReceipt\> \<avgReceipt\>226.00\</avgReceipt\> \<deliveryType\>PICKUP\</deliveryType\> \<dishAmount\>6.000\</dishAmount\> \<orderCount\>2.00\</orderCount\> \</metric\> \</metrics\> \</row\> ... \</rows\> \</report\> |

## GET reports/delivery/regions

| Parameters |  |
| :---- | :---- |
| *department* | Id department  |
| *dateFrom* | Report start date (DD.MM.YYYY or YYYY-MM-DD) |
| *dateTo* | End date of the report |
| Request  | http://localhost:9080/resto/api/reports/delivery/regions?department={code="5"}\&dateFrom=01.04.2014\&dateTo=30.04.2014\&key=08c12b43-3b43-6493-c758-3ee1e6f2a978 |
| Result | \<report\> \<rows\> \<row\> \<\!--average delivery time--\> \<averageDeliveryTime\>18.41\</averageDeliveryTime\> \<\!--percentage of delivered orders--\> \<deliveredOrdersPercent\>100.00\</deliveredOrdersPercent\> \<\!--maximum number of orders per day--\> \<maxOrderCountDay\>142.00\</maxOrderCountDay\> \<\!--общее кол-во заказов--\> \<orderCount\>2336.00\</orderCount\> \<\!--регион--\> \<region\>G1\</region\> \</row\> \</rows\> \</report\> |

## GET reports/delivery/loyalty

| Parameters |  |
| :---- | :---- |
| *department* | Id department  |
| *dateFrom* | Report start date (DD.MM.YYYY or YYYY-MM-DD) |
| *dateTo* | End date of the report |
|  metricType |  |
| Request  | http://localhost:9080/resto/api/reports/delivery/loyalty?department={code="5"}\&dateFrom=01.04.2014\&dateTo=30.04.2014\&metricType=AVERAGE\&key=23d49457-025c-f23c-35dd-8e32eceef8a4 |
| Result | \<report\> \<rows\> \<row\> \<\!--Date--\> \<date\>01.04.2014\</date\> \<\!--Metric type--\> \<metricType\>AVERAGE\</metricType\> \<newGuestCount\>58.00\</newGuestCount\> \<\!--среднее кол-во заказов на гостя--\> \<orderCountPerGuest\>1.08\</orderCountPerGuest\> \<regions\> \<region\> \<orderCount\>61.00\</orderCount\> \<\!--Region--\> \<region\>G1\</region\> \</region\> \<region\> \<orderCount\>153.00\</orderCount\> \</region\> \</regions\> \<totalOrderCount\>214.00\</totalOrderCount\> \</row\> ... \</rows\> \</report\> |

# Olap report

| HTTP  Method | GET |
| :---- | :---- |
| URI  | **reports/olap** |
| Result  | *report struct* |

## Parameters

| Name | Value | Description |
| :---- | :---- | :---- |
| *report* | SALES \- Sales TRANSACTIONS \- By transactions DELIVERY \- By delivery STOCK \- Storage control  | Report type  |
| *groupRow* | Grouping fields, for example: groupRow=WaiterName& groupRow=OpenTime | You can group by field if the value in the Grouping column for the field is true  |
| *groupCol* | Fields for highlighting values ​​by columns | You can group by field if the value in the Grouping column for the field is true  |
| *agr* | Aggregation fields, for example: agr=DishDiscountSum\&agr=VoucherNum | Aggregation can be performed on a field if the value in the Aggregation column for the field is true  |
| *from* | DD.MM.YYYY  | Start date |
| *to* | DD.MM.YYYY | Final date |

##### Request example

| [http://localhost:8080/resto/api/reports/olap?key=ec621550-afae-133e-80c8-76155db2b268\&report=SALES\&from=01.12.2014\&to=18.12.2014\&groupRow=WaiterName\&groupRow=OpenTime\&agr=fullSum\&agr=OrderNum](http://localhost:8080/resto/api/reports/olap?key=ec621550-afae-133e-80c8-76155db2b268&report=SALES&from=01.12.2014&to=18.12.2014&groupRow=WaiterName&groupRow=OpenTime&agr=fullSum&agr=OrderNum) |
| :---- |

## Warehouse operations report

## 

| HTTP  Method | GET |
| :---- | :---- |
| URI  | **reports**/**storeOperations** |
| Result  | *storeReportItemDto struct* |

## 

### Parameters

| Name | Value | Description |
| :---- | :---- | :---- |
| *dateFrom* | DD.MM.YYYY  | Start date |
| *dateTo* | DD.MM.YYYY  | Final date |
| *stores* | GUID | List of warehouses for which the report is generated. If null or empty, it is built for all warehouses. |
| *documentTypes* |  | Document types to include. If null or empty, all documents are included. |
| *productDetalization* | Boolean  | If true, the report includes product information but does not include the date. If false \- the report includes each document on one line and fills in the sums of the documents |
| *showCostCorrections* | Boolean  | Whether to include cost adjustments. This option is taken into account only if a filter by document types is specified. Otherwise, corrections are included. |
| *presetId* | GUID  | Preconfigured report ID. If specified, all settings except dates are ignored. |

##### Request example

| [http://localhost:8080/resto/api/reports/storeOperations?key=1ac6b9a3-19a0-7c60-e23b-124dd70d75da\&dateFrom=01.09.2014\&dateTo=09.09.2014\&productDetalization=false\&showCostCorrections=false\&documentTypes=SALES\_DOCUMENT\&documentTypes=INCOMING\_INVOICE\&stores=1239d270-1bbe-f64f-b7ea-5f00518ef508\&stores=93c5cc1f-4c80-4bea-9100-70053a10e37a](http://localhost:8080/resto/api/reports/storeOperations?key=1ac6b9a3-19a0-7c60-e23b-124dd70d75da&dateFrom=01.09.2014&dateTo=09.09.2014&productDetalization=false&showCostCorrections=false&documentTypes=SALES_DOCUMENT&documentTypes=INCOMING_INVOICE&stores=1239d270-1bbe-f64f-b7ea-5f00518ef508&stores=93c5cc1f-4c80-4bea-9100-70053a10e37a) |
| :---- |

## Warehouse operation report presets

| HTTP  Method | GET |
| :---- | :---- |
| URI  | **reports/storeReportPresets** |
| Result  | *storeReportPresets struct* |

##### Request example

| [http://localhost:8080/resto/api/reports/storeReportPresets?key=1ac6b9a3-19a0-7c60-e23b-124dd70d75da](http://localhost:8080/resto/api/reports/storeReportPresets?key=1ac6b9a3-19a0-7c60-e23b-124dd70d75da) |
| :---- |

## 

## Sales consumption of products

| HTTP  Method | GET |
| :---- | :---- |
| URI  |  **reports/productExpense** |
| Result  | *dayDishValue struct* |

### Parameters

| Name | Value | Description |
| :---- | :---- | :---- |
| *department* | GUID  | Subdivision |
| *dateFrom* | DD.MM.YYYY | Start date |
| *dateTo* | DD.MM.YYYY | Final date |
| *hourFrom* | hh  | Starting hour of the sampling interval in days (default \-1, all the time) |
| *hourTo* | hh  | Sampling interval end hour in days (default \-1, all the time)  |

##### Request example

| [http://localhost:8080/resto/api/reports/productExpense?key=1ac6b9a3-19a0-7c60-e23b-124dd70d75da\&department=49023e1b-6e3a-6c33-0133-cce1f6f5000b\&dateFrom=01.12.2014\&dateTo=17.12.2014\&hourFrom=12\&hourTo=15](http://localhost:8080/resto/api/reports/productExpense?key=1ac6b9a3-19a0-7c60-e23b-124dd70d75da&department=49023e1b-6e3a-6c33-0133-cce1f6f5000b&dateFrom=01.12.2014&dateTo=17.12.2014&hourFrom=12&hourTo=15) |
| :---- |

## 

## Report sales

| HTTP  Method | GET |
| :---- | :---- |
| URI  |  reports/sales |
| Result  | *dayDishValue structure* |

### Parameters

| Name | Value | Description |
| :---- | :---- | :---- |
| *department* | GUID  | Subdivision |
| *dateFrom* | DD.MM.YYYY | Start date |
| *dateTo* | DD.MM.YYYY | Final date |
| *hourFrom* | hh  | Starting hour of the sampling interval in days (default \-1, all the time) |
| *hourTo* | hh  | Sampling interval end hour in days (default \-1, all the time)  |
| *dishDetails* | Boolean | Whether to enable breakdown by dish (true/false), false by default |
| *allRevenue* | Boolean | Filtering by payment types (true \- all types, false \- only revenue), by default true |

##### Request example

| [http://localhost:8080/resto/api/reports/sales?key=1ac6b9a3-19a0-7c60-e23b-124dd70d75da\&department=49023e1b-6e3a-6c33-0133-cce1f6f5000b\&dateFrom=01.12.2014\&dateTo=17.12.2014\&hourFrom=12\&hourTo=15\&dishDetails=true\&allRevenue=false](http://localhost:8080/resto/api/reports/sales?key=1ac6b9a3-19a0-7c60-e23b-124dd70d75da&department=49023e1b-6e3a-6c33-0133-cce1f6f5000b&dateFrom=01.12.2014&dateTo=17.12.2014&hourFrom=12&hourTo=15&dishDetails=true&allRevenue=false) |
| :---- |

## 

## 

## 

## Daily revenue plan

| HTTP  Method | GET |
| :---- | :---- |
| URI  | reports/monthlyIncomePlan |
| Result  | budgetPlanItemDtoes structure |

### Parameters

| Name | Value | Description |
| :---- | :---- | :---- |
| *department* | GUID | Subdivision |
| *dateFrom* | DD.MM.YYYY  | Start date |
| *dateTo* | DD.MM.YYYY  | Final date |

##### Request example

| [http://localhost:8080/resto/api/reports/monthlyIncomePlan?key=05e04d9e-26db-a5a2-ba2b-68af4e8a5ed4\&department=49023e1b-6e3a-6c33-0133-cce1f6f5000b\&dateFrom=01.12.2014\&dateTo=18.12.2014](http://localhost:8080/resto/api/reports/monthlyIncomePlan?key=05e04d9e-26db-a5a2-ba2b-68af4e8a5ed4&department=49023e1b-6e3a-6c33-0133-cce1f6f5000b&dateFrom=01.12.2014&dateTo=18.12.2014) |
| :---- |

## 

## Report on the occurrence of goods in a dish

| HTTP  Method | GET |
| :---- | :---- |
| URI  | reports/ingredientEntry |
| Result  | ingredientEntryDtoes structure |

### Parameters

| Name | Value | Description |
| :---- | :---- | :---- |
| *department* | GUID | Subdivision |
| *date* | GUID   | Product ID |
| *product* | DD.MM.YYYY  | Final date |
| *productArticle* | String | SKU |
| *includeSubtree* | Boolean  | Whether to include subtree rows in the report (default is false) |

##### Request example

| [http://localhost:8080/resto/api/reports/ingredientEntry?key=05e04d9e-26db-a5a2-ba2b-68af4e8a5ed4\&date=01.12.2014\&product=2c3ab3e1-266d-4667-b344-98b6c194a305\&department=49023e1b-6e3a-6c33-0133-cce1f6f5000b\&includeSubtree=false](http://localhost:8080/resto/api/reports/ingredientEntry?key=05e04d9e-26db-a5a2-ba2b-68af4e8a5ed4&date=01.12.2014&product=2c3ab3e1-266d-4667-b344-98b6c194a305&department=49023e1b-6e3a-6c33-0133-cce1f6f5000b&includeSubtree=false) |
| :---- |

## 

# Lines Olap report 

| HTTP  Method | GET |
| :---- | :---- |
| URI  | **reports**/**olap**/**columns** |
| Result  | Json structure |

| Parameters | Description  |
| :---- | :---- |
| reportType  | SALES  TRANSACTIONS  DELIVERIES  |

## Lines list structure

| JSON |
| :---- |
| "FieldName": {   "name": "StringValue",   "type": "StringValue",   "aggregationAllowed": booleanValue,   "groupingAllowed": booleanValue,   "filteringAllowed": booleanValue,   "tags": \[ 	"StringValue1", 	"StringValue2", 	..., 	"StringValueN",   \] } |

| Name | Value | Description |
| :---- | :---- | :---- |
| FieldName | String | Report column name |
| name | String | Syrve Office report column name |
| type  | String | Line type ENUM   STRING  ID \- Internal object identifier DATETIME INTEGER PERCENT DURATION\_IN\_SECONDS AMOUNT  MONEY   |
| aggregationAllowed | true/false  | If true, then data can be aggregated by this column |
| groupingAllowed | true/false  | If true, then data can be grouped by this column |
| filteringAllowed | true/false  | If true, then data can be filtered by this column |
| tags | List of String | List of report categories this field belongs to. Reference Information. Corresponds to the list in the upper right corner of the report builder in SyrveOffice. |

##### Request example

| http://localhost:8080/resto/api/v2/reports/olap/columns?key=5b119afe-9468-ab68-7d56-c71495e39ee4\&reportType=SALES  |
| :---- |

## 

| JSON |
| :---- |
| {   "PercentOfSummary.ByCol": { 	"name": "% by column", 	"type": "PERCENT", 	"aggregationAllowed": true, 	"groupingAllowed": false, 	"filteringAllowed": false, 	"tags": \[   	"Payment" 	\]   },   "PercentOfSummary.ByRow": { 	"name": "% by line", 	"type": "PERCENT", 	"aggregationAllowed": true, 	"groupingAllowed": false, 	"filteringAllowed": false, 	"tags": \[   	"Payment" 	\]   },   "Delivery.Email": { 	"name": "Delivery email", 	"type": "STRING", 	"aggregationAllowed": false, 	"groupingAllowed": true, 	"filteringAllowed": true, 	"tags": \[   	"Delivery",   	“Delivery customer" 	\]   } } |

## General info

| HTTP  Method | POST |
| :---- | :---- |
| URI  | **reports**/**olap** |
| Result  | JSON structure |

### Request Header

| Content-type: Application/json; charset=utf-8 |
| :---- |

| JSON  |
| :---- |
| {   "reportType": "EnumValue",   "buildSummary": "true",   "groupByRowFields": \[ 	"groupByRowFieldName1", 	"groupByRowFieldName2", 	..., 	"groupByRowFieldNameN"   \],   "groupByColFields": \[ 	"groupByColFieldName1", 	"groupByColFieldName2", 	..., 	"groupByColFieldNameL"   \],   "aggregateFields": \[ 	"AggregateFieldName1", 	"AggregateFieldName2", 	..., 	"AggregateFieldNameM"   \],   "filters": { 	filter1, 	filter2, 	... 	filterK   } } |

| Name | Values | Description |
| :---- | :---- | :---- |
| reportType | SALES TRANSACTIONS DELIVERIES |  |
| groupByRowFields | List of lines to group by row | Names of fields by which grouping is available. The list of fields can be obtained through the reports/olap/columns method, as the elements of this list are used by the FieldName fields from the returned reports/olap/columns structure. Fields with groupingAllowed \= true are available for specifying in this list |
| groupByColFields | List of lines to group by columns | Optional. Names of fields by which grouping is available. The list of fields can be obtained through the reports/olap/columns method, as the elements of this list are used by the FieldName fields from the returned reports/olap/columns structure. Fields with groupingAllowed \= true are available for specifying in this list |
| aggregateFields | List of lines for aggregation | Names of fields by which aggregation is available. The list of fields can be obtained through the reports/olap/columns method, as the elements of this list are used by the FieldName fields from the returned reports/olap/columns structure. Fields with filteringAllowed \= true are available for specifying in this list |
| filters | Filter list |  |

## Filters

### Filter by value

| JSON |
| :---- |
| "FieldName": { "filterType": "filterTypeEnum", "values": \["Value1","Value2",...,"ValueN"\] } |

Filter by value does for lines type:

* ENUM  
* STRING

| Name | Values | Description |
| :---- | :---- | :---- |
| FieldName | Name line for filter | The FieldName field from the returned structure reports/olap/columns |
| filterType | IncludeValues / ExcludeValues  | IncludeValues ​​- only the listed field values ​​are included in the filtering ExcludeValues ​​- field values ​​are included in the filtering, except for those listed |
| values | List values line | Depending on the type of the field, it can be either an enum from the Decryption of Basic Type Codes or the text value of the field |

| JSON |
| :---- |
| "DeletedWithWriteoff": { "filterType": "ExcludeValues", "values": \["DELETED\_WITH\_WRITEOFF","DELETED\_WITHOUT\_WRITEOFF"\] }, "OrderDeleted": { "filterType": "IncludeValues", "values": \["NOT\_DELETED"\] } |

### Filters by diapason

| JSON |
| :---- |
| "FieldName": { "filterType": "Range", "from": Value1, "to": Value2, "includeLow": booleanValue, "includeHigh": booleanValue } |

Filter by diapason does for lines type:

* INTEGER  
* PERCENT  
* AMOUNT  
* MONEY

| Name | Values | Description |
| :---- | :---- | :---- |
| FieldName | Name line for filter | The FieldName field from the returned structure reports/olap/columns |
| filterType | Range | Filter by diapason |
| from  | Bottom line |  |
| to  | Upper range limit |  |
| includeLow  | true/false  | Optional, defaults to true true \- the lower bound of the range is included in the filter false \- the lower bound of the range is not included in the filter  |
| includeHigh  | true/false  | Optional, defaults to true true \- the lower bound of the range is included in the filter false \- the lower bound of the range is not included in the filter  |

| JSON |
| :---- |
| "SessionNum": { "filterType": "Range", "from": 758, "to": 760, "includeHigh": true } |

### Filters by date

| JSON |
| :---- |
| "FieldName": { "filterType": "DateRange", "periodType": "periodTypeEnum", "from": "fromDateTime", "to": "toDateTime", "includeLow": booleanValue, "includeHigh": booleanValue } |

Filter by date does for lines type:

* DATETIME  
* DATE

| Name | Values | Description |
| :---- | :---- | :---- |
| FieldName | Name line for filter | The FieldName field from the returned structure reports/olap/columns |
| filterType | DateRange  | Filter by diapason |
| periodType | CUSTOM  OPEN\_PERIOD TODAY  YESTERDAY CURRENT\_WEEK CURRENT\_MONTH CURRENT\_YEAR LAST\_WEEK LAST\_MONTH  LAST\_YEAR  | If the period is CUSTOM, then the period is set manually, the fields from, to, includeLow, includeHigh are used For other period types, these parameters are ignored (you can not use them), except for the from parameter, its transmission is mandatory, its value can be any.  |
| from  | Bottom line | Date in format yyyy-MM-dd'T'HH:mm:ss.SSS  |
| to  | Upper range limit | Date in format yyyy-MM-dd'T'HH:mm:ss.SSS  |
| includeLow  | true/false  | Optional, defaults to true true \- the lower bound of the range is included in the filter false \- the lower bound of the range is not included in the filter  |
| includeHigh  | true/false  | Optional, defaults to false true \- the lower bound of the range is included in the filter false \- the lower bound of the range is not included in the filter  |

|               In the OLAP report on transactions ("reportType": "TRANSACTIONS"), it is recommended to use the DateTime.DateTyped field (or DateTime.Typed \- but this is a date-time) to filter by \*date\* The OLAP report on sales and deliveries uses the OpenDate.Typed Every OLAP query must contain a date filter  |
| :---- |

| JSON |
| :---- |
| "OpenDate.Typed": { "filterType": "DateRange", "periodType": "CUSTOM", "from": "2014-01-01T00:00:00.000", "to": "2014-01-03T00:00:00.000" } |

### Filters by date and time

| XML |
| :---- |
| "filters": { "OpenDate.Typed": { "filterType": "DateRange", "periodType": "CUSTOM", "from": "2018-09-04", "to": "2018-09-04", "includeLow": true, "includeHigh": true }, "OpenTime": { "filterType": "DateRange", "periodType": "CUSTOM", "from": "2018-09-04T01:00:00.000", "to": "2018-09-04T23:00:00.000", "includeLow": true, "includeHigh": true } } |

#### Response

| JSON |
| :---- |
| {   "data": \[ 	{   	"GroupFieldName1": "Value11",   	"GroupFieldName2": "Value12",    	...,   	"GroupFieldNameN": "Value1N",   	"AggregateFieldName1": "Value11",   	"AggregateFieldName1": "Value12",    	...,   	"AggregateFieldNameM": "Value1M" 	}, 	..., 	{   	"GroupFieldName1": "ValueK1",   	"GroupFieldName2": "ValueK2",    	...,   	"GroupFieldNameN": "ValueKN",   	"AggregateFieldName1": "ValueK1",   	"AggregateFieldName1": "ValueK2",    	...,   	"AggregateFieldNameM": "ValueKM" 	}   \],   "summary": \[    \[   	{     	    	},   	{     	"AggregateFieldName1": "TotalValue1",     	"AggregateFieldName2": "TotalValue2",     	...,     	"AggregateFieldNameM": "TotalValueM"   	} 	\], 	\[   	{     	"GroupFieldName1": "Value11"   	},   	{     	"AggregateFieldName1": "TotalValue11",     	"AggregateFieldName2": "TotalValue12",     	...,     	"AggregateFieldNameM": "TotalValue1M"   	} 	\], 	...,    \[   	{     	"GroupFieldName1": "Value1",     	...     	"GroupFieldNameN": "ValueN",   	},   	{     	"AggregateFieldName1": "TotalValue11",     	"AggregateFieldName2": "TotalValue12",     	...,     	"AggregateFieldNameM": "TotalValue1M"   	}    \],    ...   \] } |

| Name | Values | Description |
| :---- | :---- | :---- |
| data  | Report data | Report data (line by line), one record inside the block corresponds to one line in the SyrveOffice grid |
| summary  | Intermediate and general results of the report | List of blocks consisting of two structures. In the first structure \- a list of fields for which subtotals are collected, the elements of this structure are the fields that are used for grouping. The number of elements in the structure is different and can be: empty \- this means that the second block contains the totals for the report a list of grouping fields for which subtotals are collected. The list has a length from 1 to the number of grouping fields. The fields are added to the list in the order in which they appear in the query. In the second \- actually intermediate results. The elements of this structure are the fields that are used for aggregation. The number of elements of this structure is fixed and equal to the number of fields for aggregation. |

## Report by balances

### Balances by transactions/counteragen**t**/department

| HTTP Method  | GET |
| :---- | :---- |
| URI | **reports**/**balance**/**counteragents?timestamp**\=**{timestamp}\&account**\=**{account}\&counteragent**\=**{counteragent}\&department**\=**{department}** |
| Parameters  | timestamp-post-date report time in the format yyyy-MM-dd'T'HH:mm:ss (mandatory); account-account id for filtering (optional, you can specify several); counteragent \- id of the counterparty for filtering (optional, you can specify several); department \- department id for filtering (optional, you can specify several); |
| Description  | Response balances |

#### Request example

| http://localhost:9080/resto/api/v2/reports/balance/counteragents?key=88e98be8-89c4-766b-a319-dc6d1f3b8cec\&timestamp=2016-10-19T23:10:10  |
| :---- |

## 

| JSON |
| :---- |
| \[ { "account": "657ded9f-a1a3-416c-91a4-5a2fc78e8a36", "counteragent": null, "department": "ef9461e9-d673-c6ed-0150-a59eb13f000d", "sum": 64083 }, { "account": "8a11a460-04f3-43fe-a245-bc32a7d22504", "counteragent": null, "department": "ef9461e9-d673-c6ed-0150-a59eb13f000d", "sum": \-50 }, { "account": "97036ddb-b2e1-cd47-1669-c145daa9f9c5", "counteragent": "6a656dcc-9e1b-4a3a-90a8-01202184c93f", "department": "ef9461e9-d673-c6ed-0150-a59eb13f000d", "sum": 39.37 }, { "account": "56729828-f09b-d58e-04be-ed0f2e4e10e1", "counteragent": "6a656dcc-9e1b-4a3a-90a8-01202184c93f", "department": "ef9461e9-d673-c6ed-0150-a59eb13f000d", "sum": \-66494 }, { "account": "07926ff3-9319-b93e-80ff-1897825fdead", "counteragent": null, "department": "ef9461e9-d673-c6ed-0150-a59eb13f000d", "sum": 728.25 }, { "account": "1239d270-1bbe-f64f-b7ea-5f00518ef508", "counteragent": null, "department": "ef9461e9-d673-c6ed-0150-a59eb13f000d", "sum": 2380.3 }, { "account": "67af8bc9-628f-2124-2345-3750bb7db6fa", "counteragent": null, "department": "ef9461e9-d673-c6ed-0150-a59eb13f000d", "sum": \-686.92 } \] |

## Remaining stock

| HTTP Method  | GET |
| :---- | :---- |
| URI  | **reports**/**balance**/**stores?timestamp**\=**{timestamp}\&department={department}\&store={store}\&product**\=**{product}** |
| Parameters  | timestamp \- accounting-date time of the report in the format yyyy-MM-dd'T'HH:mm:ss (mandatory);  department — department id for filtering (optional, you can specify more than one);  store — warehouse id for filtering (optional, you can specify several);  product — item id for filtering (optional, you can specify more than one); |
| Description  | Returns quantitative (amount) and monetary (sum) balances of goods (product) in warehouses (store) for a given accounting date-time |

#### Request example

| http://localhost:9080/resto/api/v2/reports/balance/counteragents?key=88e98be8-89c4-766b-a319-dc6d1f3b8cec\&timestamp=2016-10-19T23:10:10  |
| :---- |

## 

| JSON |
| :---- |
| \[ { "store": "657ded9f-a1a3-416c-91a4-5a2fc78e8a36", "product": "f464e4d4-cf9c-49a2-9e18-1227b41a3801", "amount": 123, "sum": 64083 }, { "store": "1239d270-1bbe-f64f-b7ea-5f00518ef508", "product": "c6d6c2f2-7e48-4ac9-84ca-1f566c3a941e", "amount": 29.45, "sum": 1159.3 }, { "store": "1239d270-1bbe-f64f-b7ea-5f00518ef508", "product": "f464e4d4-cf9c-49a2-9e18-1227b41a3801", "amount": 15, "sum": 1221 } \] |

# Events

## List of events

| HTTP  Method | GET |
| :---- | :---- |
| URI | **api**/**events** |
| Result | *eventsList* |
| Description | *groupsList* |

Parameters

| Name | Values | Description |
| :---- | :---- | :---- |
| from\_time | *yyyy-MM-ddTHH:mm:ss.SSS* | Time from which events are requested, in ISO format: yyyy-MM-ddTHH:mm:ss.SSS, by default \- the beginning of the current day |
| to\_time | *yyyy-MM-ddTHH:mm:ss.SSS* | Time for which (not inclusive) events are requested in ISO format: yyyy-MM-ddTHH:mm:ss.SSS,, by default, the limit is not set |
| from\_rev | Number | Revision with which events are requested, number. Each response contains the revision tag, the value of which corresponds to the revision for which the events were sent, inclusive; on new requests, revision \+ 1 (revision from the previous answer) should be used to get only new events. In normal mode, the same event does not come again with different revisions, but such a guarantee is not given. The event ID (UUID) is unique and can be used as a key. |

#### Request example

| 1)http://localhost:8080/resto/api/events?key=39c4c88f-4758-64e3-3b4c-ad6f589c0dc2 2)http://localhost:8080/resto/api/events?key=46dcaad5-b139-b976-88a2-1cf9b567195c\&from\_time=2014-06-16T00:00:00.000\&to\_time=2014-06-18T23:59:59.999 3)http://localhost:8181/resto/api/events?key=3192935b-26f7-4d61-b11d-58feb1a7d69b\&from\_rev=10016007 |
| :---- |

## 

## List of events by events filter and order number

| HTTP  Method | POST |
| :---- | :---- |
| URI | api/events |
| Body | List events id  |
| Result | *eventsList* |
| Description | *The \<type\> field uses the value of the \<id\> field of the groupsList structure.* |

### Body

| XML |
| :---- |
| \<eventsRequestData\> \<events\> \<event\>orderCancelPrecheque\</event\> \<event\>orderPaid\</event\> \</events\> \<orderNums\> \<orderNum\>175658\</orderNum\> \</orderNums\> \</eventsRequestData\> |

## Metadata events

| HTTP  Method | GET |
| :---- | :---- |
| URI | **api**/**events**/**metadata** |
| Result | *groupsList(XSD Metadata events)* |
| Description | Returns the event tree (similar to the event log hierarchy in Syrve Office). The \<id\> field is used as the value of the \<type\> field of the eventList structure. The structure also defines a list of attributes specific to this event. |

#### Request example

| http://localhost:8080/resto/api/events/metadata?key=43d272ed-cfb1-64b1-9842-f3078cd69172 |
| :---- |

## 

## Metadata events by filter

| HTTP  Method | POST |
| :---- | :---- |
| URI | api/events/metadata |
| Body | List of event ids to filter by (application/xml) |
| Result | *groupsList(XSD Metadata events)* |
| Description | Returns the event tree (similar to the event log hierarchy in Syrve Office). The \<id\> field is used as the value of the \<type\> field of the eventList structure. The structure also defines a list of attributes specific to this event. |

#### Request example

| http://localhost:8080/resto/api/events/metadata?key=933a2e7c-be36-d2ee-0b96-9509e6f24fa1 |
| :---- |

### Body

| XML |
| :---- |
| \<eventsRequestData\> 	\<events\>     	\<event\>orderOpened\</event\> 	\</events\> \</eventsRequestData\> |

## 

## Information of checkout shifts

##  

| HTTP  Method | GET |
| :---- | :---- |
| URI | **api**/**events**/**sessions?** |
| Result | Information of checkout shifts |
| Description | Opening time, closing time, manager, shift number, checkout number |

### Parameters

| Name | Value | Description |
| :---- | :---- | :---- |
| **from\_time** | *yyyy-MM-ddTHH:mm:ss.SSS* | Time from which the data on cash shifts are requested, in ISO format: yyyyy-MM-ddTH:mm:ss.SSS. |
| *to\_time* | *yyyy-MM-ddTHH:mm:ss.SSS* | Time up to which (not included) data on cash shifts are requested in ISO format: yyyyy-MM-ddTHH:mm:ss.SSS, |

#### Request example

| http://localhost:8080/resto/api/events/sessions?key=43d272ed-cfb1-64b1-9842-f3078cd69172\&from\_time=2015-03-28T00:00:00.000\&to\_time=2015-03-28T00:00:00.000 |
| :---- |

## 

## 

## XSD Metadata events

| XML |
| :---- |
| \<\!-- Event log tree description schema \--\> \<\!-- The tree is given as a linear structure \--\> \<\!-- groups of events. Information about the hierarchy of groups \--\> \<\!-- inside the tree structure is lost \--\> \<\!-- In addition, the information about the binding and non-binding attributes of the events is lost \--\> \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   \<xs:element name="group" type="group"/\>   \<xs:element name="type" type="type"/\>   \<xs:element name="attribute" type="attribute"/\>   \<xs:element name="groupsList" type="groupsList"/\>   \<\!-- The event tree consists of a list of groups \--\>   \<xs:complexType name="groupsList"\> 	\<xs:sequence\>   	\<xs:element ref="group" minOccurs="0" maxOccurs="unbounded"/\> 	\</xs:sequence\>   \</xs:complexType\>   \<\!-- Elements of this list are event groups \--\>   \<xs:complexType name="group"\> 	\<xs:sequence\>   	\<\!-- Event group metadata id \--\>   	\<xs:element name="id" type="xs:string" minOccurs="0"/\>   	\<\!-- Event group metadata name \--\>   	\<xs:element name="name" type="xs:string" minOccurs="0"/\>   	\<\!--  List events are included  in the group \--\>   	\<xs:element ref="type" minOccurs="0" maxOccurs="unbounded"/\> 	\</xs:sequence\>   \</xs:complexType\>   \<\!-- Event is included in  events book  \--\>   \<xs:complexType name="type"\> 	\<\!-- Each event consists of a set of--\> 	\<xs:sequence\>   	\<\!-- Events list attribute--\>   	\<xs:element name="attribute" type="attribute" minOccurs="0" maxOccurs="unbounded"/\>   	\<\!-- Event type metadata id \--\>   	\<xs:element name="id" type="xs:string" minOccurs="0"/\>   	\<\!-- Event type metadata name \--\>   	\<xs:element name="name" type="xs:string" minOccurs="0"/\>   	\<\!-- Event importance (number) (0 \- Low, 1 \- Medium, 2 \- High) \--\>   	\<xs:element name="severity" type="xs:string" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\>   \<\!-- Event SKU \--\>   \<xs:complexType name="attribute"\> 	\<xs:sequence\>   	\<\!--Event attribute metadata id \--\>   	\<xs:element name="id" type="xs:string" minOccurs="0"/\>   	\<\!-- Event attribute metadata name \--\>   	\<xs:element name="name" type="xs:string" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\> \</xs:schema\> |

## XSD List events

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   \<xs:element name="event" type="event"/\>   \<xs:element name="eventAttribute" type="eventAttribute"/\>   \<xs:element name="eventsList" type="eventsList"/\>   \<\!-- Events \--\>   \<xs:complexType name="eventsList"\> 	\<xs:sequence\>   	\<\!-- List events--\>   	\<xs:element ref="event" minOccurs="0" maxOccurs="unbounded"/\>   	\<\!-- Revision list events--\>   	\<xs:element name="revision" type="xs:int" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\>   \<\!-- Event \--\>   \<xs:complexType name="event"\> 	\<xs:sequence\>   	\<\!-- Attributes list event \--\>   	\<\!-- Some events have obligatory attributes \- on such crossings it is obligatory to \--\>   	\<xs:element name="attribute" type="eventAttribute" minOccurs="0" maxOccurs="unbounded"/\>   	\<\!-- Date and time event \--\>   	\<xs:element name="date" type="xs:dateTime" minOccurs="0"/\>   	\<\!-- Department ID \--\>   	\<xs:element name="departmentId" type="xs:string" minOccurs="0"/\>   	\<\!-- Event ID \--\>   	\<xs:element name="id" type="xs:string" minOccurs="0"/\>   	\<\!-- Event type metadata name \--\>   	\<xs:element name="type" type="xs:string" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\>   \<\!-- Event attribute  \--\>   \<xs:complexType name="eventAttribute"\> 	\<xs:sequence\>   	\<\!-- Attribute name \--\>   	\<xs:element name="name" type="xs:string" minOccurs="0"/\>   	\<\!-- Attribute value \--\>   	\<xs:element name="value" type="xs:string" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\> \</xs:schema\> |

# Suppliers

##  

| HTTP Method | GET |
| :---: | :---- |
| **URI** | **/suppliers/** |
| **Result** | Suppliers list  |

 

#### **Parameters**

 

| Name | Value | Description |
| :---- | :---- | :---- |
| revisionFrom | **number, revision number**  | The revision number from which you want to filter entities. Not including the revision itself, i.e. object revision \> revisionFrom. By default (non-revision query) revisionFrom \= \-1 |

Request example

| [http://localhost:8080/resto/api/suppliers?key=52cf1990-5a4c-b086-538d-e06607c17d16\&revisionFrom=-1](http://localhost:8080/resto/api/suppliers?key=52cf1990-5a4c-b086-538d-e06607c17d16&revisionFrom=-1) |
| :---- |

## 

## **Search supplier**

| HTTP Method | GET |
| :---: | :---- |
| **URI** | **/suppliers/search** |
| **Result** | Suppliers list  |

#### 

#### 

#### **Parameters**

| Name | Value | Description |
| :---- | :---- | :---- |
| name | {regexp} | name \- supplier name in format regex. Value isn’t required  |
| code | {regexp} | code \- supplier code in format regex, Value isn’t required |

Request example

| [http://localhost:8080/resto/api/suppliers/search?key=9a02e96c-273a-ef74-9977-0a0005630317\&name=ppl\&code=3](http://localhost:8080/resto/api/suppliers/search?key=9a02e96c-273a-ef74-9977-0a0005630317&name=ppl&code=3) |
| :---- |

## 

## **Supplier price list** 

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **/suppliers/{code}/pricelist** |
| **Result** | *supplierPriceListItemDto* *structure* |

#### 

#### **Parameters**

| Name | Value | Description |
| :---- | :---- | :---- |
| date | DD.MM.YYYY | The start date of the price list, optional. If the parameter is not specified, the last price list is returned. |

Request example

| [http://localhost:8080/resto/api/suppliers/3/pricelist?key=695173d1-a241-7261-d191-6d381a1cc851](http://localhost:8080/resto/api/suppliers/3/pricelist?key=695173d1-a241-7261-d191-6d381a1cc851) |
| :---- |

## 

## XSD Supplier

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>     \<xs:element name="employee" type="employee"/\>     \<xs:complexType name="employee"\>         \<xs:sequence\>             \<xs:element name="activationDate" type="xs:dateTime" minOccurs="0"/\>             \<xs:element name="address" type="xs:string" minOccurs="0"/\>             \<xs:element name="birthday" type="xs:dateTime" minOccurs="0"/\>             \<xs:element name="cardNumber" type="xs:string" minOccurs="0"/\>             \<xs:element name="cellPhone" type="xs:string" minOccurs="0"/\>             \<\!-- If Supplier is a client  of the restaurant, value is true \--\>             \<xs:element name="client" type="xs:string" minOccurs="0"/\>             \<xs:element name="code" type="xs:string"/\>             \<xs:element name="deactivationDate" type="xs:dateTime" minOccurs="0"/\>             \<xs:element name="deleted" type="xs:boolean"/\>             \<xs:element name="departmentCodes" type="xs:string" nillable="true" minOccurs="0" maxOccurs="unbounded"/\>             \<xs:element name="email" type="xs:string" minOccurs="0"/\>             \<\!-- If Supplier is an employee of the  restaurant, value is true \--\>                             \<xs:element name="employee" type="xs:string" minOccurs="0"/\>                         \<xs:element name="firstName" type="xs:string" minOccurs="0"/\>                          \<xs:element name="hireDate" type="xs:dateTime" minOccurs="0"/\>             \<xs:element name="hireDocumentNumber" type="xs:string" minOccurs="0"/\>                         \<xs:element name="id" type="xs:string"/\>                         \<xs:element name="lastName" type="xs:string" minOccurs="0"/\>                          \<xs:element name="login" type="xs:string" minOccurs="0"/\>                          \<xs:element name="mainRoleCode" type="xs:string" minOccurs="0"/\>                          \<xs:element name="middleName" type="xs:string" minOccurs="0"/\>                          \<xs:element name="name" type="xs:string"/\>                          \<xs:element name="note" type="xs:string" minOccurs="0"/\>             \<xs:element name="password" type="xs:string" minOccurs="0"/\>             \<xs:element name="phone" type="xs:string" minOccurs="0"/\>                         \<xs:element name="pinCode" type="xs:string" minOccurs="0"/\>             \<xs:element name="responsibilityDepartmentCodes" type="xs:string" nillable="true" minOccurs="0" maxOccurs="unbounded"/\>             \<xs:element name="roleCodes" type="xs:string" nillable="true" minOccurs="0" maxOccurs="unbounded"/\>             \<xs:element name="supplier" type="xs:string" minOccurs="0"/\>                          \<xs:element name="taxpayerIdNumber" type="xs:string" minOccurs="0"/\>         \</xs:sequence\>     \</xs:complexType\> \</xs:schema\>  |

## XSD Price list

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   \<xs:element name="supplierPriceListItemDto" type="supplierPriceListItemDto"/\>   \<xs:complexType name="supplierPriceListItemDto"\>     \<xs:sequence\>       \<\!-- Product ID \--\>       \<xs:element name="nativeProduct" type="xs:string" minOccurs="0"/\>       \<\!-- Product code--\>       \<xs:element name="nativeProductCode" type="xs:string" minOccurs="0"/\>       \<\!-- SKU \--\>       \<xs:element name="nativeProductNum" type="xs:string" minOccurs="0"/\>       \<\!-- Product name \--\>       \<xs:element name="nativeProductName" type="xs:string" minOccurs="0"/\>       \<\!-- Supplier product id \--\>       \<xs:element name="supplierProduct" type="xs:string" minOccurs="0"/\>       \<\!-- Supplier product code \--\>       \<xs:element name="supplierProductCode" type="xs:string" minOccurs="0"/\>       \<\!-- Supplier product  SKU \--\>       \<xs:element name="supplierProductNum" type="xs:string" minOccurs="0"/\>      \<\!-- Supplier product  name \--\>       \<xs:element name="supplierProductName" type="xs:string" minOccurs="0"/\>       \<\!-- Product price \--\>       \<xs:element name="costPrice" type="xs:decimal" minOccurs="0"/\>       \<\!-- Permissible deviation from price(%) \--\>       \<xs:element name="allowablePriceDeviation" type="xs:decimal" minOccurs="0"/\>       \<\!-- Packaging--\>       \<xs:element name="container" type="containerDto" minOccurs="0"/\>     \</xs:sequence\>   \</xs:complexType\>    \<\!-- Packing \--\>    \<xs:complexType name="containerDto"\>     \<xs:sequence\>       \<\!--Packages ID \--\>       \<xs:element name="id" type="xs:string" minOccurs="0"/\>       \<\!-- Packages name \--\>       \<xs:element name="name" type="xs:string" minOccurs="0"/\>       \<\!-- Number of basic units of goods in the packing \--\>       \<xs:element name="count" type="xs:decimal" minOccurs="0"/\>       \<\!--Tare weight \--\>       \<xs:element name="containerWeight" type="xs:decimal" minOccurs="0"/\>       \<xs:element name="fullContainerWeight" type="xs:decimal" minOccurs="0"/\>       \<\!-- Recalculation inverse (true/false) \--\>       \<xs:element name="backwardRecalculation" type="xs:boolean" minOccurs="0"/\>       \<xs:element name="deleted" type="xs:boolean" minOccurs="0"/\>       \<xs:element name="useInFront" type="xs:boolean" minOccurs="0"/\>     \</xs:sequence\>   \</xs:complexType\> \</xs:schema\>  |

# Employees

## Active employees

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **/employees/** |
| **Result** | *List employees* |

#### Parameters

| Name | Description |
| :---- | :---- |
| **includeDeleted** | Returning both current and deleted employees |

#### Request example

| [http://localhost:8080/resto/api/employees?key=284c5690-2b56-b1d6-0c81-e94b5034243d](http://vm-delivery-03:8080/resto/api/employees?key=284c5690-2b56-b1d6-0c81-e94b5034243d) |
| :---- |

## 

## 

## List by subdivision

| HTTP Method | GET |
| :---- | :---- |
| **URI** | /**employees**/**byDepartment**/**{departmentCode}** |
| **Result** | List of employees in the specified unit All employees (including built-in system accounts) that are active (not deleted) |

#### Request example

| [http://localhost:8080/resto/api/employees/1](http://vm-delivery-03:8080/resto/api/employees?key=284c5690-2b56-b1d6-0c81-e94b5034243d) |
| :---- |

## 

#### Parameters

| Name | Description |
| :---- | :---- |
| **includeDeleted** | Returning both current and deleted employees |

#### Request example

| http://localhost:8080/resto/api/employees/byDepartment/1?key=284c5690-2b56-b1d6-0c81-e94b5034243d |
| :---- |

## 

## Employee search by ID

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **/employees/byId/{employeeUUID}** |
| **Result** | Employee by ID |

#### Request example

| http://localhost:8080/resto/api/employees/byId/61b97cfb-6b4e-4668-9a38-c30190f7a109?key=18c8a55-efae-8183-0d6d-015a685f84f1 |
| :---- |

## 

## Employee search by code

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **/employees/byCode/{employeeCode}** |
| **Result** | Employee by code |

#### Request example

| http://localhost:8080/resto/api/employees/byCode/2?key=a10b7fdc-9ae5-449f-c6fb-cb5a67e5b2e |
| :---- |

## Employee search  

| HTTP Method | GET |  |
| ----- | :---- | ----- |
| **URI** | **/search?firstName={regexp}\&middleName={regexp}** |  |
| **Result** | Сотрудник с указанными именем и/или отчеством |  |
| **Name parameters** |  | **Description**  |
| address cardNumber cellPhone client code ~~deleted~~ (используйте includeDeleted) email employee firstName lastName login mainRoleCode middleName name note phone supplier |  | Regular expression  |
| **includeDeleted**  |  | Returning both current and deleted employees |

#### Request example

| http://localhost:8080/resto/api/employees/search?key=de7c43fc-b4d7-cf45-51b4-c40cba21265f\&firstName=n\&middleName=m |
| :---- |

### 

## Adding or creating an employee by ID

| HTTP Method | PUT |
| :---- | :---- |
| **URI** | **/employees/byId/{UUID}** |
| **Result** | **If a new id is passed, a new employee will be created (return code 201 Created). If the id of an existing employee is passed, all fields of the employee will be completely replaced (return code 200 OK). At that if any optional field is not specified, the value of that field will be reset. To update a partial set of fields, use the POST method /employees/byId/{employeeUID}** |

 Request example

| http://localhost:8080/resto/api/employees/byId/4f390698-241d-6ab9-015e-a3d90baa0370 |
| :---- |

### 

| XML |
| :---- |
|  \<?xml version="1.0" encoding="UTF-8" standalone="yes" ?\> \<employee\>     	\<code\>6\</code\>     	\<name\>АPIbyId\</name\>     	\<login/\>     	\<mainRoleCode\>CS1\</mainRoleCode\>     	\<roleCodes\>CS1\</roleCodes\>     	\<phone\>7979\</phone\>     	\<cellPhone\>00000\</cellPhone\>     	\<firstName\>Name\</firstName\>     	\<lastName\>Name\</lastName\>     	\<birthday\>2017-09-14T00:00:00+03:00\</birthday\>     	\<email\>email2@mail.ru\</email\>     	\<address\>address\</address\>     	\<hireDate\>2017-09-04T00:00:00+03:00\</hireDate\>     	\<fireDate\>2017-09-21T00:00:00+03:00\</fireDate\>     	\<cardNumber/\>     	\<taxpayerIdNumber\>111111111111111111\</taxpayerIdNumber\>     	\<snils\>455555555555555555\</snils\>     	\<preferredDepartmentCode\>1\</preferredDepartmentCode\>     	\<departmentCodes\>1\</departmentCodes\>     	\<responsibilityDepartmentCodes\>1\</responsibilityDepartmentCodes\>     	\<deleted\>false\</deleted\>     	\<supplier\>false\</supplier\>     	\<employee\>true\</employee\>     	\<client\>false\</client\>     	\<publicExternalData\>            	\<entry\>                    	\<key\>keyPUT\</key\>                    	\<value\>valuePUT\</value\>            	\</entry\>     	\</publicExternalData\> \</employee\>  |

### 

## Adding an employee by code

| HTTP Method | PUT |
| :---- | :---- |
| **URI** | **/employees/byCode/{employeeCode}** |
| **Result** | New employee (return code 201 Created). |

### Request example

| http://localhost:8080/resto/api/employees/byId/5 |
| :---- |

### 

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes" ?\> \<employee\>     	\<code\>5\</code\> 	\<name\>АPI\</name\> 	\<login/\> 	\<mainRoleCode\>CS1\</mainRoleCode\> 	\<roleCodes\>CS1\</roleCodes\> 	\<phone\>78787878\</phone\> 	\<cellPhone\>56565\</cellPhone\> 	\<firstName\>firstName\</firstName\> 	\<lastName\>lastName\</lastName\> 	\<birthday\>2017-09-14T00:00:00+03:00\</birthday\> 	\<email\>email@mail.ru\</email\> 	\<address\>address\</address\> 	\<hireDate\>2017-09-04T00:00:00+03:00\</hireDate\> 	\<fireDate\>2017-09-21T00:00:00+03:00\</fireDate\> 	\<cardNumber/\> 	\<taxpayerIdNumber\>111111111111111111\</taxpayerIdNumber\> 	\<snils\>455555555555555555\</snils\> 	\<preferredDepartmentCode\>1\</preferredDepartmentCode\> 	\<departmentCodes\>1\</departmentCodes\> 	\<responsibilityDepartmentCodes\>1\</responsibilityDepartmentCodes\> 	\<deleted\>false\</deleted\> 	\<supplier\>false\</supplier\> 	\<employee\>true\</employee\> 	\<client\>false\</client\> \</employee\>  |

### 

## Edit/add employee (by id)

| HTTP Method | POST |
| :---- | :---- |
| **URI** | **/employees/byId/{employeeUUID}** |
| **Result** | If a new id is passed, a new employee will be created (return code 201 Created). If the id of an existing employee is passed, the specified fields will be changed (return code 200 OK). The fields that are not specified in the query will remain unchanged. To completely replace all fields, use the PUT method /employees/byId/{employeeUID} |

### Request example

| http://localhost:8080/resto/api/employees/byId/4f390698-241d-6ab9-015e-a3d90baa0370 |
| :---- |

### 

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes" ?\> \<employee\>     	\<id\>4f390698-241d-6ab9-015e-a3d90baa0370\</id\>     	\<code\>10\</code\>     	\<name\>name\</name\>     	\<login/\>     	\<mainRoleCode\>CS1\</mainRoleCode\>     	\<roleCodes\>CS1\</roleCodes\>     	\<phone\>7979\</phone\>     	\<cellPhone\>00000\</cellPhone\>     	\<firstName\>Name\</firstName\>     	\<lastName\>Name\</lastName\>     	\<birthday\>2017-09-14T00:00:00+03:00\</birthday\>     	\<email\>email2@mail.ru\</email\>     	\<address\>address\</address\>     	\<hireDate\>2017-09-04T00:00:00+03:00\</hireDate\>     	\<fireDate\>2017-09-21T00:00:00+03:00\</fireDate\>     	\<cardNumber/\>     	\<taxpayerIdNumber\>000000000000\</taxpayerIdNumber\>     	\<snils\>455555555555555555\</snils\>     	\<preferredDepartmentCode\>1\</preferredDepartmentCode\>     	\<departmentCodes\>1\</departmentCodes\>     	\<responsibilityDepartmentCodes\>1\</responsibilityDepartmentCodes\>     	\<deleted\>false\</deleted\>     	\<supplier\>false\</supplier\>     	\<employee\>true\</employee\>     	\<client\>false\</client\>     	\<publicExternalData\>            	\<entry\>                    	\<key\>key\_POST1\</key\>                    	\<value\>value\_POST1\</value\>            	\</entry\>            	\<entry\>                    	\<key\>key\_POST2\</key\>                    	\<value\>value\_POST2\</value\>            	\</entry\>     	\</publicExternalData\> \</employee\>  |

## 

## Delete employee

| HTTP Method | DELETE |
| :---- | :---- |
| **URI** | **/employees/byId/{employeeUUID}** |
| **Result** | Пустой ответ если сотрудник удален (или уже был удален) Entity of class User not found by id (employeeUUID), если передан несуществующий guid |

### Request example

| [http://localhost:8080/resto/api/employees/byId/4f390698-241d-6ab9-015e-a3d90baa0370](http://localhost:8080/resto/api/employees/byId/4f390698-241d-6ab9-015e-a3d90baa0370) |
| :---- |

### 

## Roles

### Roles list

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **/employees/roles** |
| **Result** | Roles list |

#### **Parameters**

| Name | Value | Description |
| :---- | :---- | :---- |
| revisionFrom | number, revision number   | The revision number from which you want to filter entities. Not including the revision itself, i.e. object revision \> revisionFrom. By default (non-revision query) revisionFrom \= \-1 |

 

#### Request example

| http://localhost:8080/resto/api/employees/roles |
| :---- |

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<employeeRoles\>   \<role\> 	\<id\>d9753f67-6e87-4564-9b74-4018c37306d7\</id\> 	\<code\>BAR1\</code\> 	\<name\>Barista\</name\> 	\<paymentPerHour\>2.500000000\</paymentPerHour\> 	\<steadySalary\>1860.000000000\</steadySalary\> 	\<scheduleType\>SESSION\</scheduleType\> 	\<deleted\>false\</deleted\>   \</role\>   \<role\> 	\<id\>01a014eb-6609-c206-dbed-3102179f80be\</id\> 	\<code\>SMB\</code\> 	\<name\>Somebody\</name\> 	\<paymentPerHour\>2.000000000\</paymentPerHour\>     \<steadySalary\>340.000000000\</steadySalary\> 	\<scheduleType\>HOURS\</scheduleType\> 	\<deleted\>false\</deleted\>   \</role\> \</employeeRoles\>  |

## Salary

|  | HTTP Method | URI |
| :---- | :---- | :---- |
| List of salary | GET | **/employees/salary/** |
| Salary get by ID | GET | **/employees/salary/byId/{employeeUUID}** |
| Salary on date | GET | **/employees/salary/byId/{employeeUUID}/{YYYY-MM-DD}/** |

## Store list

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **/employees/salary/** |
| **Result** | List of salaries of employees not removed |

#### Parameters

| Name | Value | Description |
| :---- | :---- | :---- |
| revisionFrom | number, revision number   | The revision number from which you want to filter entities. Not including the revision itself, i.e. object revision \> revisionFrom. By default (non-revision query) revisionFrom \= \-1 |

### 

## Set the salary

### **Установить оклад**

| HTTP Method | POST |
| :---- | :---- |
| **URI** | **/employees/salary/byId/{employeeUUID}/{YYYY-MM-DD}/** |
| **Result** | **salary structure** |

#### Parameters

| Name | Description |
| :---- | :---- |
| {employeeUUID} | User ID |
| {YYYY-MM-DD} | Date of start of the salary |
| payment | Salary sum |

#### Request example

| http://localhost:8080/resto/api/employees/salary/byId/4f390698-241d-6ab9-015e-a3d90baa0370/2017-10-01?payment=50000 |
| :---- |

## Shift schedule

### **Get type shift**

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **/employees/schedule/types** |
| **Request** | includedDeleted \- not implemented |
| **Result** | All shift types that are not deleted are returned. |

#### 

#### Request example

| http://localhost:8080/resto/api/employees/schedule/types |
| :---- |

### **Get type shift**

| HTTP Method | GET |
| ----- | :---- |
| **URI** | **/employees/schedule/?from={YYYY-MM-DD}\&to={YYYY-MM-DD}\&withPaymentDetails={true/false}\&revisionFrom=-1** **/employees/schedule/byEmployee/{employeeUUID}/?from={YYYY-MM-DD}\&to={YYYY-MM-DD}\&withPaymentDetails={true/false}\&revisionFrom=-1** **/employees/schedule/byDepartment/{departmentCode}/?from={YYYY-MM-DD}\&to={YYYY-MM-DD}\&withPaymentDetails={true/false}\&revisionFrom=-1** **/employees/schedule/byDepartment/{departmentCode}/byEmployee/{employeeUUID}/?from={YYYY-MM-DD}\&to={YYYY-MM-DD}\&withPaymentDetails={true/false}\&revisionFrom=-1 /employees/schedule/department/{departmentId}/?from={YYYY-MM-DD}\&to={YYYY-MM-DD}\&withPaymentDetails={true/false}\&revisionFrom=-1 /employees/schedule/department/{departmentId}/byEmployee/{employeeUUID}/?from={YYYY-MM-DD}\&to={YYYY-MM-DD}\&withPaymentDetails={true/false}\&revisionFrom=-1** |
| **Request** | from — report start date in the format YYYY-MM-DD to — report end date in the format YYYY-MM-DD employeeUUID —employee  ID departmentCode  departmentId  withPaymentDetails — If true, information about time worked and payroll accrued on appearances will be added to the shifts. Employees working on a free schedule may not have shifts; if they do, their paymentDetails will be empty.  If the employee has unclosed appearances that started earlier, there will be an error if true. revisionFrom \-revision number from which you want to filter entities. Not including the revision itself, i.e. object revision \> revisionFrom. |

All shifts that cross the report interval are returned.

At the same time, unlike other API methods, here sample end date including: \&to=2016-03-21 will return shifts crossing 2016-03-22 00:00:00.

#### Request example

| http://localhost:8080/resto/api/employees/schedule/?from=2017-03-21\&to=2017-03-22\&withPaymentDetails=true |
| :---- |

### 

### **Create or update shift** 

| HTTP Method | POST |
| :---- | :---- |
| **URI** | **/employees/schedule/create** /**employees/schedule/update** |
| **Request** | Structure of schedule. The id field may not be filled in when created. Dates are rounded to the nearest minute. |
| **Result** | Structure of schedule after saving, with rounded dates, generated new id. Warning. If you update the schedule, its id may change. |

#### Request example

| http://localhost:8080/resto/api/employees/schedule/create   |
| :---- |

### 

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes" ?\> \<schedule\> \<employeeId\>0a508f8c-4cdb-4126-bd0d-243c4718c22f\</employeeId\>     	\<roleId\>6e3fa11d-3617-c735-bd29-aeac662741ed\</roleId\>     	\<dateFrom\>2017-10-06T16:00:00+03:00\</dateFrom\>     	\<dateTo\>2017-10-06T22:00:00+03:00\</dateTo\>     	\<scheduleTypeCode\>DSH\</scheduleTypeCode\>     	\<nonPaidMinutes\>0\</nonPaidMinutes\>     	\<departmentId\>2b602c10-2045-4f52-b5f9-d00be812d6aa\</departmentId\>     	\<departmentName\>ТП1\</departmentName\> \</schedule\>  |

 

### **Delete employee shift** 

| HTTP Method | DELETE |
| :---- | :---- |
| **URI** | **/employees/schedule/byId/{scheduleUUID}** |
| **Result** | Удаленная смена **schedule**. |

## Attendance

### Get attendance type

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **/employees/attendance/types** |
| **Result** | All unsuccessful turnout types are returned. |

#### 

#### Parameters

| Name | Value | Description |
| :---- | :---- | :---- |
| includeDeleted | true\\false | Whether to include deleted items in the result. The default is false. |
| revisionFrom | number, revision number | The revision number from which you want to filter entities. Not including the revision itself, i.e. object revision \> revisionFrom. By default (non-revision query) revisionFrom \= \-1 |

Request example

| [http://localhost:8080/resto/api/employees/attendance/types](http://localhost:8080/resto/api/employees/schedule/?from=2017-03-21&to=2017-03-22&withPaymentDetails=true) |
| :---- |

### **Get  attendance**

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **/employees/attendance?from={YYYY-MM-DD}\&to={YYYY-MM-DD}\&withPaymentDetails={true/false}\&revisionFrom=-1** **/employees/attendance/byEmployee/{employeeUUID}/?from={YYYY-MM-DD}\&to={YYYY-MM-DD}\&withPaymentDetails={true/false}\&revisionFrom=-1** **/employees/attendance/byDepartment/{departmentCode}/?from={YYYY-MM-DD}\&to={YYYY-MM-DD}\&withPaymentDetails={true/false}\&revisionFrom=-1** **/employees/attendance/byDepartment/{departmentCode}/byEmployee/{employeeUUID}/?from={YYYY-MM-DD}\&to={YYYY-MM-DD}\&withPaymentDetails={true/false}\&revisionFrom=-1 /employees/attendance/department/{departmentId}/?from={YYYY-MM-DD}\&to={YYYY-MM-DD}\&withPaymentDetails={true/false}\&revisionFrom=-1 /employees/attendance/department/{departmentId}/byEmployee/{employeeUUID}/?from={YYYY-MM-DD}\&to={YYYY-MM-DD}\&withPaymentDetails={true/false}\&revisionFrom=-1** |
| **Request** | from — report start date in the format YYYY-MM-DD to — report end date in the format YYYY-MM-DD employeeUUID —employee  ID departmentCode  departmentId  withPaymentDetails — If true, information about time worked and payroll accrued on appearances will be added to the shifts. Employees working on a free schedule may not have shifts; if they do, their paymentDetails will be empty.  If the employee has unclosed appearances that started earlier, there will be an error if true. revisionFrom \-revision number from which you want to filter entities. Not including the revision itself, i.e. object revision \> revisionFrom.  |

#### Request example

| http://localhost:8080/resto/api/employees/attendance?from=2017-08-01\&to=2017-10-09\&withPaymentDetails=true |
| :---- |

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes" ?\> \<attendances\> 	\<attendance\>     	\<id\>faa6d21e-7193-4c1f-885c-6049ddddd0ce\</id\>     	\<employeeId\>0a508f8c-4cdb-4126-bd0d-243c4718c22f\</employeeId\>     	\<roleId\>6e3fa11d-3617-c735-bd29-aeac662741ed\</roleId\>     	\<dateFrom\>2017-09-21T10:27:00+03:00\</dateFrom\>     	\<attendanceType\>W\</attendanceType\>     	\<comment/\>     	\<departmentId\>2b602c10-2045-4f52-b5f9-d00be812d6aa\</departmentId\>     	\<departmentName\>ТП1\</departmentName\>     	\<paymentDetails\>         	\<regularPayedMinutes\>0\</regularPayedMinutes\>         	\<regularPaymentSum\>0\</regularPaymentSum\>         	\<overtimePayedMinutes\>0\</overtimePayedMinutes\>         	\<overtimePayedSum\>0\</overtimePayedSum\>         	\<otherPaymentsSum\>0\</otherPaymentsSum\>     	\</paymentDetails\>     	\<personalDateFrom\>2017-09-21T10:27:00+03:00\</personalDateFrom\>     	\<created\>2017-09-21T10:27:53.987+03:00\</created\> 	\</attendance\> 	\<attendance\>        \<id\>72582fa9-172b-4956-9b66-c3b40efff751\</id\>     	\<employeeId\>0a508f8c-4cdb-4126-bd0d-243c4718c22f\</employeeId\>     	\<roleId\>6e3fa11d-3617-c735-bd29-aeac662741ed\</roleId\>     	\<dateFrom\>2017-09-21T09:02:00+03:00\</dateFrom\>     	\<dateTo\>2017-09-21T14:02:00+03:00\</dateTo\>     	\<attendanceType\>W\</attendanceType\>     	\<comment/\>     	\<departmentId\>2b602c10-2045-4f52-b5f9-d00be812d6aa\</departmentId\>     	\<departmentName\>D1\</departmentName\>     	\<paymentDetails\>         	\<regularPayedMinutes\>300\</regularPayedMinutes\>         	\<regularPaymentSum\>50.000000000\</regularPaymentSum\>         	\<overtimePayedMinutes\>0\</overtimePayedMinutes\>         	\<overtimePayedSum\>0\</overtimePayedSum\>         	\<otherPaymentsSum\>0\</otherPaymentsSum\>     	\</paymentDetails\>     	\<personalDateFrom\>2017-09-21T09:02:00+03:00\</personalDateFrom\>     	\<created\>2017-09-21T09:02:40.343+03:00\</created\>     	\<modified\>2017-09-21T10:17:06.620+03:00\</modified\>     	\<userModified\>c831367e-778f-e80f-18f7-bd0843cd10c6\</userModified\> 	\</attendance\> \</attendances\>  |

### **Create or update a turnout**

| HTTP Method | POST |
| :---- | :---- |
| **URI** | **/employees/attendance/create** **/employees/attendance/update** |
| **Request** | Structure. The id field may not be filled in when created. Dates are rounded to the nearest minute. Creation of overlapping attendances is forbidden. |
| **Result** | Structure after saving, with rounded dates, generated id. Warning\! If you update the attendance its id may change. |

#### Request example

| http://localhost:8080/resto/api/employees/attendance/create  |
| :---- |

| XML |
| :---- |
| \<attendance\>     	\<employeeId\>0a508f8c-4cdb-4126-bd0d-243c4718c22f\</employeeId\>     	\<roleId\>6e3fa11d-3617-c735-bd29-aeac662741ed\</roleId\>     	\<dateFrom\>2017-10-08T10:00:00+03:00\</dateFrom\>     	\<dateTo\>2017-10-08T18:00:00+03:00\</dateTo\>      	\<attendanceType\>W\</attendanceType\>     	\<comment/\>     	\<departmentId\>2b602c10-2045-4f52-b5f9-d00be812d6aa\</departmentId\>     	\<departmentName\>D1\</departmentName\>     	\<personalDateFrom\>2017-10-08T10:00:00+03:00\</personalDateFrom\>     	\<personalDateFrom\>2017-10-08T18:00:00+03:00\</personalDateFrom\>     	\<created\>2017-10-08T10:00:00.000+03:00\</created\> \</attendance\>  |

### Remote attendance

| HTTP Method | DELETE |
| :---- | :---- |
| **URI** | **/employees/attendance/byId/{attendanceUUID}** |
| **Result** | Remote attendance |

#### Request example

| http://localhost:8080/resto/api/employees/attendance/byId/d9d8aa67-9e10-97ee-015e-f1879f9c5e87  |
| :---- |

## **Availability of employees**

### **Get employee availability**

| HTTP Method | GET |
| :---- | ----- |
| **URI** | **/employees/availability/list?from={YYYY-MM-DD}\&to={YYYY-MM-DD}\&department={departmentUUID}\&role={roleUUID}\&user={userUUID}** |
| **Result** | List of accessibility segments. |
| **Name**  | **Description** |
| from | Report start date (inclusive). |
| to | The end date of the report (excluding). Attention: Availability segments will be generated by schedules for the whole requested interval, i.e., you should use the minimum required date (week/month ahead). |
| department | Id of the subdivision of the employee to be filtered. You can set the parameter more than once. If none is set, the data on employees of all divisions is displayed. |
| role | The id of the employee's position to filter. You can set the parameter more than once. If none is set, the data on employees of all positions is displayed. |
| user | Id of the employee to filter. You can set the parameter several times. If it is not set, the data on all employees are displayed. |

#### Request example

| http://localhost:8080/resto/api/employees/availability/list?from=2017-09-01\&to=2017-10-09\&department=2b602c10-2045-4f52-b5f9-d00be812d6aa\&role=6e3fa11d-3617-c735-bd29-aeac662741ed\&user=0a508f8c-4cdb-4126-bd0d-243c4718c22f |
| :---- |

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes" ?\> \<availabilities\>     	\<availability\>            	\<employeeId\>0a508f8c-4cdb-4126-bd0d-243c4718c22f\</employeeId\>            	\<dateFrom\>2017-09-01T00:00:00+03:00\</dateFrom\>            	\<dateTo\>2017-10-09T00:00:00+03:00\</dateTo\>     	\</availability\> \</availabilities\>  |


## **Entity descriptions for XML representation (XSD schema)**

### **Employee**

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   	\<xs:element name="employee" type="employee"/\>   	\<xs:complexType name="employee"\>     	\<xs:sequence\>         	\<xs:element name="id" type="xs:string" minOccurs="1"/\>         	\<xs:element name="code" type="xs:string" minOccurs="1"/\>         	\<xs:element name="name" type="xs:string" minOccurs="1"/\>         	\<xs:element name="login" type="xs:string" minOccurs="0"/\>             	             \<xs:element name="password" type="xs:string" minOccurs="0"/\>               \<xs:element name="mainRoleId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="rolesIds" type="xs:string" nillable="true" minOccurs="0" maxOccurs="unbounded"/\>               \<xs:element name="mainRoleCode" type="xs:string" minOccurs="0"/\>         	\<xs:element name="roleCodes" type="xs:string" nillable="true" minOccurs="0" maxOccurs="unbounded"/\>             \<xs:element name="phone" type="xs:string" minOccurs="0"/\>         	\<xs:element name="cellPhone" type="xs:string" minOccurs="0"/\>         	\<xs:element name="firstName" type="xs:string" minOccurs="0"/\>         	\<xs:element name="middleName" type="xs:string" minOccurs="0"/\>         	\<xs:element name="lastName" type="xs:string" minOccurs="0"/\>         	\<xs:element name="birthday" type="xs:dateTime" minOccurs="0"/\>         	\<xs:element name="email" type="xs:string" minOccurs="0"/\>         	\<xs:element name="address" type="xs:string" minOccurs="0"/\>         	\<xs:element name="hireDate" type="xs:string" minOccurs="0"/\>         	\<xs:element name="hireDocumentNumber" type="xs:string" minOccurs="0"/\>         	\<xs:element name="fireDate" type="xs:date" nillable="true" minOccurs="0"/\>         	\<xs:element name="note" type="xs:string" minOccurs="0"/\>         	         	\<xs:element name="cardNumber" type="xs:string" minOccurs="0"/\>         	         	\<xs:element name="pinCode" type="xs:string" minOccurs="0"/\>         	         	\<xs:element name="taxpayerIdNumber" type="xs:string" minOccurs="0"/\>         	\<xs:element name="snils" type="xs:string" nillable="true" minOccurs="0"/\>         	         	\<xs:element name="gln" type="xs:string" minOccurs="0"/\>         	\<xs:element name="activationDate" type="xs:dateTime" minOccurs="0"/\>         	\<xs:element name="deactivationDate" type="xs:dateTime" minOccurs="0"/\>         	         	\<xs:element name="preferredDepartmentCode" type="xs:string" minOccurs="0"/\>         	         	\<xs:element name="departmentCodes" type="xs:string"                     	nillable="true" minOccurs="0" maxOccurs="unbounded"/\>             \<xs:element name="responsibilityDepartmentCodes" type="xs:string"                     	nillable="true" minOccurs="0" maxOccurs="unbounded"/\>           	\<xs:element name="deleted" type="xs:string" minOccurs="0"/\>         	\<xs:element name="supplier" type="xs:string" minOccurs="0"/\>         	\<xs:element name="employee" type="xs:string" minOccurs="0"/\>         	\<xs:element name="client" type="xs:string" minOccurs="0"/\>          	\<xs:element name="publicExternalData"\>             	\<xs:complexType\>                 	\<xs:sequence\>               	      \<xs:element name="entry" minOccurs="0" maxOccurs="unbounded"\>                         	\<xs:complexType\>                             	\<xs:sequence\>                                 	\<xs:element name="key" type="xs:string"/\>                	                 \<xs:element name="value" type="xs:string" minOccurs="0"/\>                             	\</xs:sequence\>                         	\</xs:complexType\>                     	\</xs:element\>                 	\</xs:sequence\>            	 \</xs:complexType\>         	\</xs:element\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\> |

### **Role**

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>     \<xs:element name="role" type="role"/\>     \<xs:complexType name="role"\> 	\<xs:sequence\>   	\<xs:element name="id" type="xs:string"/\>     	\<xs:element name="code" type="xs:string"/\>     	\<xs:element name="name" type="xs:string"/\>   	   	\<xs:element name="paymentPerHour" type="xs:decimal" minOccurs="0"/\>   	   	\<xs:element name="steadySalary" type="xs:decimal" minOccurs="0"/\>   	   	\<xs:element name="scheduleType" type="paymentScheme" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\>     \<xs:simpleType name="paymentScheme"\> 	\<xs:restriction base="xs:string"\>   	\<xs:enumeration value="SESSION"/\>   	\<xs:enumeration value="HOURS"/\>   	\<xs:enumeration value="FIXED"/\> 	\</xs:restriction\>   \</xs:simpleType\> \</xs:schema\>  |

### **Payment rate**

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   \<xs:element name="salary" type="salary"/\>   \<xs:complexType name="salary"\> 	\<xs:sequence\>   	\<xs:element name="dateFrom" type="xs:dateTime" minOccurs="0"/\>   	\<xs:element name="dateTo" type="xs:dateTime" minOccurs="0"/\>   	\<xs:element name="employeeId" type="xs:string" minOccurs="0"/\>   	\<xs:element name="payment" type="xs:decimal" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\> \</xs:schema\>  |

 

### Shift in the schedule

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   	\<xs:element name="schedule" type="schedule"/\>   	\<xs:complexType name="schedule"\>     	\<xs:sequence\>         	         	\<xs:element name="id" type="xs:string"/\>         	\<xs:element name="employeeId" type="xs:string"/\>         	         	\<xs:element name="roleId" type="xs:string" minOccurs="0"/\>         	         	\<xs:element name="nonPaidMinutes" type="xs:int" default="0"/\>         	\<xs:element name="scheduleTypeId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="scheduleTypeCode" type="xs:string" minOccurs="0"/\>         	\<xs:element name="dateFrom" type="xs:dateTime" minOccurs="0"/\>         	\<xs:element name="dateTo" type="xs:dateTime" minOccurs="0"/\>         	         	\<xs:element name="departmentId" type="xs:string"/\>         	         	\<xs:element name="departmentName" type="xs:string"/\>             \<xs:element name="paymentDetails" type="paymentDetails" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\>   	 	\<xs:complexType name="paymentDetails"\>     	\<xs:sequence\>         	         	\<xs:element name="salaryDepartmentId" type="xs:string" minOccurs="1"/\>         	\<xs:element name="salaryDepartmentName" type="xs:string" minOccurs="1"/\>             \<xs:element name="regularPayedMinutes" type="xs:int" minOccurs="1"/\>         	\<xs:element name="regularPaymentSum" type="xs:decimal" minOccurs="1"/\>         	         	\<xs:element name="overtimePayedMinutes" type="xs:int" minOccurs="1"/\>         	         	\<xs:element name="overtimePaymentSum" type="xs:decimal" minOccurs="1"/\>         	\<xs:element name="otherPaymentsSum" type="xs:decimal" minOccurs="1"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\> |

### **Shift type**

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> \<xs:element name="scheduleType" type="scheduleType"/\> \<xs:complexType name="scheduleType"\> 	\<xs:sequence\>   	\<xs:element name="code" type="xs:string"/\>   	\<xs:element name="comment" type="xs:decimal" minOccurs="0"/\>   	\<xs:element name="id" type="xs:string"/\>   	\<xs:element name="lengthMinutes" type="xs:int"/\>   	\<xs:element name="name" type="xs:string"/\>   	\<xs:element name="overtime" type="xs:boolean"/\>   	\<xs:element name="startTime" type="xs:string"/\>   	\<xs:element name="tariff" type="xs:decimal" minOccurs="0"/\> 	\</xs:sequence\>   \</xs:complexType\> \</xs:schema\>  |

### **Turnout**

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   	\<xs:complexType name="attendance"\>     	\<xs:sequence\>         	\<xs:element name="id" type="xs:string"/\>         	\<xs:element name="employeeId" type="xs:string"/\>             \<xs:element name="roleId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="attendanceTypeId" type="xs:string" minOccurs="0"/\>         	\<xs:element name="attendanceType" type="xs:string" minOccurs="0"/\>         	\<xs:element name="comment" type="xs:string" minOccurs="0"/\>         	         	\<xs:element name="dateFrom" type="xs:dateTime" minOccurs="0"/\>         	         	\<xs:element name="dateTo" type="xs:dateTime" minOccurs="0"/\>         	         	\<xs:element name="personalDateFrom" type="xs:dateTime" minOccurs="0"/\>         	         	\<xs:element name="personalDateTo" type="xs:dateTime" minOccurs="0"/\>         	         	\<xs:element name="departmentId" type="xs:string" minOccurs="1"/\>         	         	\<xs:element name="departmentName" type="xs:string" minOccurs="1"/\>         	         	\<xs:element name="paymentDetails" type="paymentDetails" minOccurs="0"/\>         	         	\<xs:element name="created" type="xs:dateTime" minOccurs="0"/\>         	         	\<xs:element name="modified" type="xs:dateTime" minOccurs="0"/\> 	\<xs:element name="userModified" type="xs:string" minOccurs="0"/\>     	\</xs:sequence\> 	\</xs:complexType\>   	 	\<xs:complexType name="paymentDetails"\>     	\<xs:sequence\>  	                	\<xs:element name="salaryDepartmentId" type="xs:string" minOccurs="1"/\>         	\<xs:element name="salaryDepartmentName" type="xs:string" minOccurs="1"/\>         	         	\<xs:element name="regularPayedMinutes" type="xs:int" minOccurs="1"/\>         	         	\<xs:element name="regularPaymentSum" type="xs:decimal" minOccurs="1"/\>         	         	\<xs:element name="overtimePayedMinutes" type="xs:int" minOccurs="1"/\>         	         	\<xs:element name="overtimePaymentSum" type="xs:decimal" minOccurs="1"/\>             \<xs:element name="otherPaymentsSum" type="xs:decimal" minOccurs="1"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\>  |

### **Type of appearance**

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\> \<xs:element name="attendanceType" type="attendanceType"/\>  \<xs:complexType name="attendanceType"\> 	\<xs:sequence\>   	\<xs:element name="code" type="xs:string"/\>   	\<xs:element name="comment" type="xs:decimal" minOccurs="0"/\>   	\<xs:element name="id" type="xs:string"/\>   	\<xs:element name="name" type="xs:string"/\>   	\<xs:element name="payRate" type="xs:decimal" default="1" minOccurs="0"/\>   	\<xs:element name="status" type="xs:boolean"/\> 	\</xs:sequence\>   \</xs:complexType\> \</xs:schema\> |

 **Employee availability**

| XML |
| :---- |
| \<?xml version="1.0" encoding="UTF-8" standalone="yes"?\> \<xs:schema version="1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"\>   	\<xs:complexType name="availability"\>     	\<xs:sequence\>         	\<xs:element name="employeeId" type="xs:string"/\>         	\<xs:element name="dateFrom" type="xs:dateTime"/\>         	\<xs:element name="dateTo" type="xs:dateTime"/\>     	\</xs:sequence\> 	\</xs:complexType\> \</xs:schema\> |

# Directories 

## Get directories

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **entities/list** |
| **Result** | Json structure |
| Description | Returns general reference information without reference to subdivisions, validity periods. The result of the call may contain records (e.g., payment types) that are forbidden to be used in some divisions. This method should be used only to get names of objects for the purpose of displaying reports. |

### Parameters

| Name | Value | Description |
| :---- | :---- | :---- |
| **rootType** | Account |  **Name** Account AccountingCategory AlcoholClass AllergenGroup AttendanceType Conception CookingPlaceType DiscountType MeasureUnit OrderType PaymentType ProductCategory ProductScale ProductSize ScheduleType TaxCategory     |
| **includeDeleted** | true, false | Whether to include deleted directory items. The default is to include. |
| **revisionFrom** | Number, revision number | The revision number from which you want to filter entities. Not including the revision itself, i.e. object revision \> revisionFrom. By default (non-revision query) revisionFrom \= \-1 |

#### Request example

| http://host:port/resto/api/v2/entities/list?rootType=MeasureUnit |
| :---- |

#### Result

| Name | Description |
| :---- | :---- |
| **id** | UUID  |
| **rootType** | "Basic" object type (the one passed as an argument to the list method) |
| **deleted** | false \- the object is valid, true \- the object is marked as remote |
| **code** | Object code (including part number, service number, etc.). Is string: "1234", "3.04". Can be null. |
| **name** | Name of the object.  For localizable presets (for example, standard Accounts) \- name in the query language. |

# Prices set by the price list

## MenuChangeDocumentDto

| Name | Type | Description |
| :---- | :---- | ----- |
| **id** | UUID | ID |
| **dateIncoming** | String | Date of the document (accounting) in the format "yyyyy-MM-dd". |
| **documentNumber** | String | Document reference number. |
| **status** | Enum | Status  **Value** **NEW** **PROCESSED** **DELETED**  |
| **comment** | String | Comment |
| **shortName** | String | The short name of the order to display on the front buttons |
| **deletePreviousMenu** | Boolean | The short name of the order to display on the front buttons. |
| **scheduleId** | UUID | Schedule identifier. Specified by the user when creating/editing a time order. |
| **schedule** | PeriodScheduleDto | Timetable for the order's action by time. Read only. |
| **dateTo** | String | The date of expiration (cancellation) of the order in the format "yyyyy-MM-dd". |
| **items** | List\<MenuChangeDocumentItemDto\> | Positions of the order. |

## 

## Positions of the order

| Name | Type | Description |
| :---- | :---- | :---- |
| **departmentId** | UUID | The identifier of the department in which this product is sold. |
| **productId** | UUID | Product ID. |
| **productSizeId** | UUID | Product size identifier. |
| **prices** | List\<ProductPriceItemDto\> | List of prices at intervals for this product. |

## ProductPriceItemDto

The price that is valid and unchanged on the interval \[dateFrom, dateTo\], i.e. the price from the base order.

If a schedule is specified (schedule \!= null), then it is the price acting according to the schedule on the interval \[dateFrom, dateTo\], i.e. the price from the time order.

| Name | Type | Description |
| :---- | :---- | :---- |
| **dateFrom** | String | The beginning of the order in the format "yyyyy-MM-dd". |
| **dateTo** | String | The end of the order in the format "yyyyy-MM-dd". |
| **price** | BigDecimal | Price |
| **includeForCategories** | List\<IncludeForCategoryDto\> | If there is a category identifier in this list, then there is a specific pricing for that price category. |
| **pricesForCategories** | List\<PriceForCategoryDto\> | Prices for categories. |
| **included** | Boolean | Whether the product is included in the price list. |
| **dishOfDay** | Boolean | Is the dish a hit. |
| **flyerProgram** | Boolean | Does the dish participate in the flyer program. |
| **documentId** | UUID | Document ID |
| **schedule** | PeriodScheduleDto | Shedule |

## IncludeForCategoryDto

| Name | Type | Description |
| :---- | :---- | :---- |
| **categoryId** | UUID | Price category identifier. |
| **include** | Boolean | If true, the price is taken from PriceForCategoryDto, if false, the product is excluded from the price list for that price category. |

## PriceForCategoryDto

| Name | Type | Description |
| :---- | :---- | :---- |
| **categoryId** | UUID | **Category ID** |
| **price** | BigDecimal | Price |

## Get price

| HTTP Method | GET |
| :---- | :---- |
| **URI** | /price |
| **Result** |  **Name** **Type** **Description** **dateFrom** String The beginning of the time interval in the format "yyyyy-MM-dd". Mandatory. **dateTo** String The end of the time interval in the format 'yyyyy-MM-dd'. The default is '2500-01-01'. **departmentId** UUID The list of restaurants for which the query is made. If not specified, then for all. **includeOutOfSale** Boolean Include withdrawal records in the response. The default is false. **type** Enum **Name** **Description** **BASE** The price that is valid for the whole given interval, i.e. from the base order. **SCHEDULED** The price that is valid according to the schedule at a given interval, i.e. from the time order. **revisionFrom** Integer The response will contain entities with a revision higher than this one. The default is '-1'  |
| Description | List of prices. The revision field is the maximum revision available for uploading to external systems at the time of the query (which means that there are records with this revision in the database, but no records with a revision higher than this in the database). This revision can be used as the revisionFrom parameter in the next schedule list query. |

#### Request example

| http://localhost:8080/resto/api/v2/price?dateFrom=2019-01-01\&type=BASE |
| :---- |

| JSON |
| :---- |
| {     "result": "SUCCESS",     "errors": \[\],     "response": \[         {             "departmentId": "6713a472-973e-4215-8e0f-e3142945befd",             "productId": "8972b757-4e08-4c50-a145-80cd12bb4f1e",             "productSizeId": null,             "prices": \[                 {                     "dateFrom": "2019-12-25",                     "dateTo": "2500-01-01",                     "price": 111,                     "pricesForCategories": \[\],                     "includeForCategories": \[\],                     "included": true,                     "dishOfDay": false,                     "flyerProgram": false,                     "documentId": "a28cbb15-d8f5-458f-a8df-f1a156b9e30b",                     "schedule": null                 }             \]         },         {             "departmentId": "6713a472-973e-4215-8e0f-e3142945befd",             "productId": "a4f2ac36-2836-4cb2-ae63-e1d3b4d7a6e0",             "productSizeId": "7fd28fbc-82d1-4e3e-8280-1b6226cc3c85",             "prices": \[                 {                     "dateFrom": "2019-05-13",                     "dateTo": "2019-12-25",                     "price": 110,                     "pricesForCategories": \[\],                     "includeForCategories": \[\],                     "included": true,                     "dishOfDay": false,                     "flyerProgram": false,                     "documentId": "c061accb-e6f5-46be-9e6f-d8af185d78b3",                     "schedule": null                 }             \]         },         {             "departmentId": "6713a472-973e-4215-8e0f-e3142945befd",             "productId": "81d457b6-adbb-46de-9ac5-3923f2619b7b",             "productSizeId": null,             "prices": \[                 {                     "dateFrom": "2019-12-25",                     "dateTo": "2500-01-01",                     "price": 11,                     "pricesForCategories": \[\],                     "includeForCategories": \[\],                     "included": true,                     "dishOfDay": false,                     "flyerProgram": false,                     "documentId": "a28cbb15-d8f5-458f-a8df-f1a156b9e30b",                     "schedule": null                 }             \]         },         {             "departmentId": "6713a472-973e-4215-8e0f-e3142945befd",             "productId": "ccdada6c-1643-4c52-9e09-752a4de117a0",             "productSizeId": null,             "prices": \[                 {                     "dateFrom": "2019-12-25",                     "dateTo": "2500-01-01",                     "price": 110,                     "pricesForCategories": \[\],                     "includeForCategories": \[\],                     "included": true,                     "dishOfDay": false,                     "flyerProgram": false,                     "documentId": "a28cbb15-d8f5-458f-a8df-f1a156b9e30b",                     "schedule": null                 }             \]         },         {             "departmentId": "6713a472-973e-4215-8e0f-e3142945befd",             "productId": "4a5e8eea-8d6a-44f9-a72d-db834d666cf2",             "productSizeId": null,             "prices": \[                 {                     "dateFrom": "2019-12-25",                     "dateTo": "2500-01-01",                     "price": 12,                     "pricesForCategories": \[\],                     "includeForCategories": \[\],                     "included": true,                     "dishOfDay": false,                     "flyerProgram": false,                     "documentId": "a28cbb15-d8f5-458f-a8df-f1a156b9e30b",                     "schedule": null                 }             \]         }     \],     "revision": 186459 }  |

# Price categories

## ClientPriceCategoryDto

| Name | Type | Description |
| :---- | :---- | :---- |
| **id** | UUID | This is ID |
| **name** | String | Name category |
| **deleted** | boolean |  |
| **code** | String | Element code |
| **assignableManually** | boolean |  |
| **pricingStrategy** | PricingStrategyDto |  |

## PricingStrategyDto

| Name | Type | Description |
| :---- | :---- | :---- |
| **type** | Enum | Strategy type  **Name** **Description** ABSOLUTE\_VALUE A strategy where the discount/ markup is set as an absolute number that will be added to the base price PERCENT A calculation strategy where the discount/surcharge is set in % of the base price.  |
| **delta** | BigDecimal | The absolute value of the discount/surcharge. If the sign is '-', then the discount, if '+', then the markup. The actual value is ABSOLUTE\_VALUE. |
| **percent** | BigDecimal | The value of the discount/surcharge as a percentage. If the sign is '-', then the discount, if '+', then the surcharge. The range of values: \[-100, \+inf). Valid for PERCENT. |

## Get price categories

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **/entities/priceCategories** |
| **Result** |  **Name** **Type** **Description** **includeDeleted** Boolean Whether to include deleted items in the response. The default is false. **id** List\<UUID\> The list of price category identifiers that you want to get. If not specified, there is no filtering by IDs. **revisionFrom** Integer The response will contain entities with a revision higher than this one. The default is '-1'.  |
| Description | List of price categories. The revision field is the maximum revision available for uploading to external systems at the time of the query (which means that there are records with this revision in the database, while there are no records with a revision higher than this in the database). This revision can be used as the revisionFrom parameter in the next query for a list of price categories. |

#### Request example

| http://localhost:8080/resto/api/v2/entities/priceCategories/?includeDeleted=true |
| :---- |

| JSON |
| :---- |
| {     "result": "SUCCESS",     "errors": \[\],     "response": \[         {             "id": "95035a38-cd23-4b3b-92d8-1db673b6848f",             "name": "Delivery",             "deleted": **false**,             "code": "3",             "assignableManually": **true**,             "pricingStrategy": {                 "type": "PERCENT",                 "percent": \-5             }         },         {             "id": "515d91b3-f4e3-46fa-abc2-de7567df95c9",             "name": "Price category",             "deleted": **true**,             "code": "1",             "assignableManually": **false**,             "pricingStrategy": {                 "type": "PERCENT",                 "percent": 3             }         },         {             "id": "67a54111-99ff-40cc-9f34-f2feddd0ff2b",             "name": "Name",             "deleted": **false**,             "code": "2",             "assignableManually": **false**,             "pricingStrategy": {                 "type": "ABSOLUTE\_VALUE",                 "delta": 100             }         }     \],     "revision": 187420 } |

## Get price categories by id

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **/entities/priceCategories/byId** |
| Parameters |  **Name** **Type** **Description** **id** UUID Price categories ID  |

#### Request example

| http://localhost:8080/resto/api/v2/entities/priceCategories/byId/?id=95035a38-cd23-4b3b-92d8-1db673b6848f |
| :---- |

| JSON |
| :---- |
| {     "id": "95035a38-cd23-4b3b-92d8-1db673b6848f",     "name": "Delivery",     "deleted": **false**,     "code": "3",     "assignableManually": **true**,     "pricingStrategy": {         "type": "PERCENT",         "percent": \-5     } }  |

# Period Schedule

## PeriodScheduleDto

| Name | Type |
| :---- | :---- |
| **id** | UUID |
| **name** | String |
| **deleted** | Boolean |
| **periods** | List\<PeriodScheduleItemDto\> |

## PeriodScheduleItemDto

| Name | Type | Description |
| :---- | :---- | :---- |
| **begin** | String | The start of the half-interval as "HH:mm". |
| **end** | String | The end of the half-interval as "HH:mm". |
| **daysOfWeek** | List\<DayOfWeek\> | DayOfWeek Value Description 1 Monday 2 Tuesday  3 Wednesday 4 Thursday 5 Friday 6 Saturday 7 Sunday  |

## 

## Get period Schedules 

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **/entities/periodSchedules** |
| Parameters |  **Name** **Type** Description **includeDeleted** Boolean Whether to include deleted items in the response. The default is false. **id** List\<UUID\> The list of period Shedules identifiers that you want to get. If not specified, there is no filtering by IDs. **revisionFrom** Integer The response will contain entities with a revision higher than this one. The default is '-1'.  |
| Result | List of price . The revision field is the maximum revision available for uploading to external systems at the time of the query (which means that there are records with this revision in the database, while there are no records with a revision higher than this in the database). This revision can be used as the revisionFrom parameter in the next query for a list of price categories. |

#### Request example

| http://localhost:8080/resto/api/v2/entities/periodSchedules |
| :---- |

| JSON |
| :---- |
| {     "result": "SUCCESS",     "errors": \[\],     "response": \[         {             "id": "598ce53a-c49c-4cd5-8248-1e2b4f0994cf",             "name": "Test",             "deleted": false,             "periods": \[                 {                     "begin": "16:00",                     "end": "17:00",                     "daysOfWeek": \[                         1,                         2,                         3,                         4,                         5                     \]                 }             \]         },         {             "id": "a31ffb8a-05dd-42a1-9cc6-b1c6d4826ddf",             "name": "Weekend",             "deleted": false,             "periods": \[                 {                     "begin": "19:00",                     "end": "23:59",                     "daysOfWeek": \[                         5                     \]                 },                 {                     "begin": "00:00",                     "end": "23:59",                     "daysOfWeek": \[                         6                     \]                 },                 {                     "begin": "00:00",                     "end": "00:00",                     "daysOfWeek": \[                         7                     \]                 }             \]         }     \],     "revision": 187512 }  |

## 

## 

## Get period Schedules by ID

| HTTP Method | GET |
| :---- | :---- |
| **URI** | **/entities/periodSchedules** |
| Parameters |  **Name** **Type** Description **id** UUID Schedules period  ID  |

#### Request example

| http://localhost:8080/resto/api/v2/entities/periodSchedules/byId?id=598ce53a-c49c-4cd5-8248-1e2b4f0994cf |
| :---- |

| JSON |
| :---- |
| {     "id": "598ce53a-c49c-4cd5-8248-1e2b4f0994cf",     "name": "Test",     "deleted": **false**,     "periods": \[         {             "begin": "16:00",             "end": "17:00",             "daysOfWeek": \[                 1,                 2,                 3,                 4,                 5             \]         }     \] } |

