// 食堂常见食物热量库（每份的估算热量 kcal / 蛋白质 g，均为常见份量估算值）
window.FOODS = [
  // 主食
  { name: '米饭', cat: '主食', kcal: 174, protein: 4, unit: '1碗·150g' },
  { name: '馒头', cat: '主食', kcal: 223, protein: 7, unit: '1个·100g' },
  { name: '面条', cat: '主食', kcal: 220, protein: 7, unit: '1碗·200g' },
  { name: '全麦面包', cat: '主食', kcal: 85, protein: 4, unit: '1片·35g' },
  { name: '燕麦', cat: '主食', kcal: 150, protein: 5, unit: '1份·40g' },
  { name: '玉米', cat: '主食', kcal: 112, protein: 4, unit: '1根·200g' },
  { name: '红薯', cat: '主食', kcal: 172, protein: 2, unit: '1个·200g' },
  { name: '白粥', cat: '主食', kcal: 80, protein: 2, unit: '1碗·250g' },
  { name: '包子', cat: '主食', kcal: 150, protein: 5, unit: '1个' },
  { name: '饺子', cat: '主食', kcal: 250, protein: 10, unit: '10个' },

  // 蛋白
  { name: '水煮蛋', cat: '蛋白', kcal: 78, protein: 6, unit: '1个' },
  { name: '茶叶蛋', cat: '蛋白', kcal: 78, protein: 6, unit: '1个' },
  { name: '鸡胸肉', cat: '蛋白', kcal: 133, protein: 25, unit: '1份·100g' },
  { name: '清蒸鱼', cat: '蛋白', kcal: 120, protein: 20, unit: '1份·100g' },
  { name: '水煮虾', cat: '蛋白', kcal: 90, protein: 19, unit: '1份·100g' },
  { name: '瘦牛肉', cat: '蛋白', kcal: 133, protein: 26, unit: '1份·100g' },
  { name: '卤牛肉', cat: '蛋白', kcal: 160, protein: 25, unit: '1份·100g' },
  { name: '豆腐', cat: '蛋白', kcal: 120, protein: 12, unit: '1份·150g' },
  { name: '豆干', cat: '蛋白', kcal: 140, protein: 13, unit: '1份·80g' },
  { name: '无糖豆浆', cat: '蛋白', kcal: 80, protein: 7, unit: '1杯·250ml' },
  { name: '纯牛奶', cat: '蛋白', kcal: 135, protein: 8, unit: '1杯·250ml' },
  { name: '无糖酸奶', cat: '蛋白', kcal: 85, protein: 6, unit: '1杯·150g' },
  { name: '蛋白粉', cat: '蛋白', kcal: 120, protein: 24, unit: '1勺·30g' },

  // 蔬菜
  { name: '西兰花', cat: '蔬菜', kcal: 50, protein: 4, unit: '1份·150g' },
  { name: '绿叶菜', cat: '蔬菜', kcal: 35, protein: 2, unit: '1份·150g' },
  { name: '番茄', cat: '蔬菜', kcal: 27, protein: 1, unit: '1个·150g' },
  { name: '黄瓜', cat: '蔬菜', kcal: 30, protein: 1, unit: '1根·200g' },
  { name: '菠菜', cat: '蔬菜', kcal: 35, protein: 4, unit: '1份·150g' },
  { name: '芹菜', cat: '蔬菜', kcal: 20, protein: 1, unit: '1份·150g' },

  // 水果
  { name: '苹果', cat: '水果', kcal: 104, protein: 1, unit: '1个·200g' },
  { name: '香蕉', cat: '水果', kcal: 105, protein: 1, unit: '1根·120g' },
  { name: '橙子', cat: '水果', kcal: 85, protein: 2, unit: '1个·180g' },
  { name: '蓝莓', cat: '水果', kcal: 57, protein: 1, unit: '1盒·100g' },
  { name: '圣女果', cat: '水果', kcal: 25, protein: 1, unit: '10颗·100g' },

  // 饮品
  { name: '美式咖啡', cat: '饮品', kcal: 5, protein: 0, unit: '1杯' },
  { name: '无糖茶', cat: '饮品', kcal: 0, protein: 0, unit: '1杯' },
  { name: '拿铁', cat: '饮品', kcal: 150, protein: 8, unit: '1杯' },
  { name: '可乐(含糖)', cat: '饮品', kcal: 140, protein: 0, unit: '1罐·330ml', warn: true },
  { name: '奶茶', cat: '饮品', kcal: 400, protein: 5, unit: '1杯', warn: true },

  // 零食
  { name: '坚果', cat: '零食', kcal: 120, protein: 4, unit: '1小把·20g' },
  { name: '蛋白棒', cat: '零食', kcal: 200, protein: 20, unit: '1根' },
  { name: '薯片', cat: '零食', kcal: 300, protein: 4, unit: '1包', warn: true },
  { name: '饼干', cat: '零食', kcal: 150, protein: 2, unit: '3块', warn: true },
  { name: '辣条', cat: '零食', kcal: 300, protein: 5, unit: '1包', warn: true },

  // 红灯（少碰）
  { name: '炸鸡', cat: '红灯', kcal: 250, protein: 15, unit: '1块', warn: true },
  { name: '油条', cat: '红灯', kcal: 270, protein: 5, unit: '1根', warn: true },
  { name: '糖醋/锅包肉', cat: '红灯', kcal: 350, protein: 15, unit: '1份', warn: true },
  { name: '红烧肉', cat: '红灯', kcal: 400, protein: 15, unit: '1份', warn: true },
  { name: '蛋糕', cat: '红灯', kcal: 250, protein: 4, unit: '1块', warn: true },
];
