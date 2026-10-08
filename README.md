# 📱 Kiosco Manager

Una aplicación móvil integral desarrollada en **React Native (Expo)** y **TypeScript** para la gestión completa de negocios minoristas.

El proyecto implementa una arquitectura modular que separa claramente la lógica de negocio de la presentación visual, utilizando **SQLite** para la persistencia de datos local y garantizando disponibilidad offline.

## 🚀 Características Principales

*   **🛒 Punto de Venta (POS):** Ventas manuales y por código de barras.
*   **📦 Gestión de Inventario:** Búsqueda y lista de productos con stock.
*   **💰 Finanzas y Caja:** Cierre de caja con registro de billetes, Cuenta DNI y Mercado Pago.
*   **📊 Analítica de Datos:** KPIs semanales y mensuales con gráficos.
*   **👥 Gestión de Clientes:** Sistema de fiado (crédito/a favor).
*   **🤝 Integración de Proveedores:** Gestión de proveedores con WhatsApp integration.
*   **📈 Reportes:** Exportación a CSV y Email.

## 🛠️ Stack Tecnológico y Arquitectura

Hemos consolidado tus librerías críticas, de UI y utilerías en una sección más limpia:

*   **Core:** `expo-router` para enrutamiento basado en archivos y `@react-navigation/native`.
*   **Base de Datos:** `expo-sqlite` (Gestión relacional local para Productos, Ventas, Clientes y Proveedores).
*   **UI/UX:** `react-native-paper` con tema Material Design, íconos de `react-native-vector-icons`, y `react-native-reanimated` para animaciones fluidas (como el efecto 'shift' entre pestañas).
*   **Visualización de Datos:** `victory-native` y `@shopify/react-native-skia` para gráficos vectoriales de alta performance.
*   **Hardware y Utilidades:** `expo-image-picker` para acceso a la cámara, `expo-mail-composer` para envíos de reportes y `Linking` para aperturas de URLs externas.

## 📱 Pantallas Principales

| Pantalla | Descripción |
| :--- | :--- |
| **Home** | Buscador inteligente + 2 botones principales (Venta, Agregar Stock) |
| **Inventario** | Lista completa de productos con búsqueda y stock bajo |
| **Caja** | Total facturado, historial de ventas, reportes |
| **Estadísticas** | KPIs, gráficos semanal y por categorías |
| **Venta Manual** | Seleccionar productos con cantidades |
| **Venta por Barras** | Ingresar código y confirmar venta |
| **Nueva Carga** | Cámara + formulario para agregar productos |
| **Gestor de Proveedores** | Lista con WhatsApp integration |
| **Clientes (Fiado)** | Deuda management con sistema de a favor |

## 🏗️ Estructura del Proyecto

```text
/app                    # Rutas y pantallas (Expo Router)
/app/(tabs)/           # Pestañas inferiores (Home, Acciones, Estadísticas)
/app/(tabs)/_layout.tsx # Configuración de tabs con animación 'shift'
/app/(tabs)/index.tsx   # Pantalla Home con buscador en vivo
/app/(tabs)/acciones.tsx # Pantalla de acciones (Cierre, Proveedores, Clientes)
/app/(tabs)/estadisticas.tsx # Pantalla de estadísticas con gráficos
/app/(tabs)/inventario.tsx # Pantalla de inventario con FlatList

/app/venta-manual.tsx   # Venta manual con steppers
/app/venta-barras.tsx   # Venta por código de barras
/app/agregar-stock.tsx  # Agregar stock (manual o lector)
/app/agregar-lector.tsx # Lector de códigos para agregar stock
/app/clientes.tsx       # Gestión de clientes con fiado
/app/proveedores.tsx    # Gestión de proveedores con WhatsApp

/lib/db.ts              # Capa de datos SQLite (init, CRUD para todas tablas)
/app/caja.tsx           # Pantalla de caja con total y historial
/app/estadisticas.tsx   # Pantalla de estadísticas con gráficos


🚀 Scripts Disponibles
npm install          # Instalar dependencias
npx expo start       # Iniciar servidor de desarrollo
npx expo start --web # Versión web
npx expo reset       # Resetear el proyecto
npm run lint         # Linting de código

Desarrollado por Franco Prezioso
