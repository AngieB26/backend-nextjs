const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("=== VERIFICANDO BASE DE DATOS ===\n");

    // Contar usuarios
    const userCount = await prisma.user.count();
    console.log("📊 TABLA: User");
    console.log(`   Total de registros: ${userCount}`);
    if (userCount > 0) {
      const users = await prisma.user.findMany({ take: 3 });
      console.log("   Primeros registros:");
      users.forEach((u) => {
        console.log(`   • ID: ${u.id}, Email: ${u.email}, Name: ${u.name}`);
      });
    }
    console.log();

    // Contar categorías
    const categoryCount = await prisma.category.count();
    console.log("📊 TABLA: Category");
    console.log(`   Total de registros: ${categoryCount}`);
    if (categoryCount > 0) {
      const categories = await prisma.category.findMany({ take: 3 });
      console.log("   Primeros registros:");
      categories.forEach((c) => {
        console.log(`   • ID: ${c.id}, Name: ${c.name}, Color: ${c.color}`);
      });
    }
    console.log();

    // Contar notas
    const noteCount = await prisma.note.count();
    console.log("📊 TABLA: Note");
    console.log(`   Total de registros: ${noteCount}`);
    if (noteCount > 0) {
      const notes = await prisma.note.findMany({
        take: 3,
        include: { category: true },
      });
      console.log("   Primeros registros:");
      notes.forEach((n) => {
        console.log(`   • ID: ${n.id}`);
        console.log(`     Title: ${n.title}`);
        console.log(`     Content: ${n.content.substring(0, 50)}...`);
        console.log(`     Category: ${n.category?.name || "Sin categoría"}`);
        console.log(`     Created: ${n.createdAt}`);
      });
    }
    console.log();

    console.log(
      "✅ Conexión a la base de datos verificada correctamente\n"
    );
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
