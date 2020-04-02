// 商品库存集合
db.inventory.insert([
  { "_id" : 1, "sku" : "almonds", product: "product 1", "instock" : 120 },
  { "_id" : 2, "sku" : "bread1",  product: "product 2", "instock" : 80 },
  { "_id" : 3, "sku" : "bread2",  product: "product 2", "instock" : 80 },
  { "_id" : 4, "sku" : "pecans1", product: "product 4", "instock" : 70 },
  { "_id" : 5, "sku" : "pecans2", product: "product 4", "instock" : 70 },
])

// 原料集合
db.product.insert([
  { "_id" : 1, product: "product 1", description: "金玉满堂1" },
  { "_id" : 2,  product: "product 2", description: "招财进宝"},
  { "_id" : 3, product: "product 4", description: "杨柳依依"},
])

/**
 * 两个集合都包含有 product 字段，如果 需求是按原料名称统计每个原料对应的商品情况。
 * 可以根据字段 product 进行集合关联，并且 product 集合的文档与 inventory 集合的文档是 一对多 的关系。
 */
db.product.aggregate([
  {
    $lookup:
      {
        from: "inventory",
        localField: "product",
        foreignField: "product",
        as: "inventory_docs"
      }
 }
])

// 新生成的聚合集合的文档如下:
{
  "_id" : 1,
  "product" : "product 1",
  "description" : "金玉满堂1",
  "inventory_docs" : [
      {
          "_id" : 1,
          "sku" : "almonds",
          "product" : "product 1",
          "instock" : 120,
          "state" : "OK"
      }
  ]
},

/* 2 */
{
  "_id" : 2,
  "product" : "product 2",
  "description" : "招财进宝",
  "inventory_docs" : [
      {
          "_id" : 2,
          "sku" : "bread1",
          "product" : "product 2",
          "instock" : 80,
          "state" : "OK"
      },
      {
          "_id" : 3,
          "sku" : "bread2",
          "product" : "product 2",
          "instock" : 80,
          "state" : "Simple"
      }
  ]
},

/* 3 */
{
  "_id"  : 3,
  "product" : "product 4",
  "description" : "杨柳依依",
  "inventory_docs" : [
      {
          "_id" : 4,
          "sku" : "pecans1",
          "product" : "product 4",
          "instock" : 70,
          "state" : "OK"
      },
      {
          "_id" : 5,
          "sku" : "pecans2",
          "product" : "product 4",
          "instock" : 70,
          "state" : "Simple"
      }
  ]
}
/**
 * 从返回结果可以看出:
 * 
 * (1) 返回的文档数量和.aggreate的集合文档数量一样（即外面的那个集合，而不是新字段的From的那个集合）。
 * 
 * (2) 关联的主要功能是将每个输入待处理的文档，经过$lookup 阶段的处理，输出的新文档中会包含一个新生成的数组列（户名可根据需要命名新key的名字 ）。数组列存放的数据 是 来自 被Join 集合的适配文档，如果没有，集合为空（即 为[ ]）。
 * 
 * 注意新的字段的类型是数组的形式，一对多的时候，新字段就是就是明显的内嵌子文档。
 * 
 * 我们看到新文档的字段 inventory_docs ，它由两个 内嵌 子文档组成。
 */

"inventory_docs" : [
        {
            "_id" : 4,
            "sku" : "pecans1",
            "product" : "product 4",
            "instock" : 70,
            "state" : "OK"
        },
        {
            "_id" : 5,
            "sku" : "pecans2",
            "product" : "product 4",
            "instock" : 70,
            "state" : "Simple"
        }
    ]
 

/**
 * 那么如何根据要求筛选符合要求的子文档呢？$match是不可以的，这时候可以通过$filter。
 * 
 * 代码如下:
 */

db.product.aggregate([
   {
     $lookup:
       {
         from: "inventory",
         localField: "product",
         foreignField: "product",
         as: "inventory_docs"
       }
  }
  ,
       {
      $project: {
         inventory_docs: {
            $filter: {
               input: "$inventory_docs",
               as: "item",
              cond: { $eq: [ "$$item.state", "OK" ] }
            }
         }
      }
       }
])
// 结果显示如下：

/* 1 */
{
    "_id" : 1,
    "inventory_docs" : [
        {
            "_id" : 1,
            "sku" : "almonds",
            "product" : "product 1",
            "instock" : 120,
            "state" : "OK"
        }
    ]
},

/* 2 */
{
    "_id" : 2,
    "inventory_docs" : [
        {
            "_id" : 2,
            "sku" : "bread1",
            "product" : "product 2",
            "instock" : 80,
            "state" : "OK"
        }
    ]
},

/* 3 */
{
    "_id" : 3,
    "inventory_docs" : [
        {
            "_id" : 4,
            "sku" : "pecans1",
            "product" : "product 4",
            "instock" : 70,
            "state" : "OK"
        }
    ]
}
/**
 * 从结果可以看出，数组子文档 没有了state:"Simple"的数据（子文档）。
 */