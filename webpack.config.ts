/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import {
    Configuration as WebpackConfiguration,
    HotModuleReplacementPlugin,
} from "webpack";
import { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { TsconfigPathsPlugin as TsConfigPathsWebpackPlugin } from "tsconfig-paths-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import FaviconsWebpackPlugin from "favicons-webpack-plugin";
import ESLintWebpackPlugin from "eslint-webpack-plugin";
import BarWebpackPlugin from "webpackbar";
import path from "path";
// Resolve Merge Conflict in Webpack
interface Configuration extends WebpackConfiguration {
    devServer?: WebpackDevServerConfiguration;
}
// Define Configuration
const config: Array<Configuration> = [
    {
        // Development Configuration
        name: "development",
        mode: "development",
        // Define Entrypoints
        entry: [
            "react-hot-loader/patch",
            path.resolve(__dirname, "./src/index.ts"),
        ],
        resolve: {
            extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
            alias: {
                "react-dom": "@hot-loader/react-dom",
                "@": path.resolve(__dirname, "./src"),
                "@assets": path.resolve(__dirname, "./src/assets"),
                "@pages": path.resolve(__dirname, "./src/pages"),
                "@layout": path.resolve(__dirname, "./src/layout"),
                "@components": path.resolve(__dirname, "./src/components"),
                "@database": path.resolve(__dirname, "./src/database"),
            },
        },
        module: {
            rules: [
                {
                    test: /.(js|ts)x?$/,
                    exclude: /node_modules/,
                    loader: "babel-loader",
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"],
                },
                {
                    test: /\.svg$/,
                    use: ["@svgr/webpack", "url-loader"],
                },
                {
                    test: /\.(png|jpg|gif)$/i,
                    use: [
                        {
                            loader: "url-loader",
                            options: {
                                limit: 8192,
                            },
                        },
                    ],
                },
            ],
        },
        // Define Outputs
        target: "web",
        output: {
            filename: "bundle.js",
            path: path.resolve(__dirname, "dist"),
        },
        devServer: {
            contentBase: path.resolve(__dirname, "public"),
            contentBasePublicPath: "/static",
            compress: true,
            port: 9000,
            hot: true,
            open: true,
            historyApiFallback: true,
        },
        stats: {
            colors: true,
            modules: false,
        },
        // Define Plugins
        plugins: [
            new HotModuleReplacementPlugin(),
            new ESLintWebpackPlugin({
                extensions: ["js", "jsx", "json", "ts", "tsx"],
                files: "src",
            }),
            new CleanWebpackPlugin(),
            new FaviconsWebpackPlugin(
                path.resolve(__dirname, "./src/assets/knight.svg")
            ),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, "./public/index.html"),
            }),
            new BarWebpackPlugin({}),
        ],
    },
    {
        // Production Configuration
        name: "production",
        mode: "production",
        // Define Entrypoints
        entry: [path.resolve(__dirname, "./src/index.ts")],
        resolve: {
            extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
            alias: {
                "react-dom": "@hot-loader/react-dom",
                "@": path.resolve(__dirname, "./src"),
                "@assets": path.resolve(__dirname, "./src/assets"),
                "@pages": path.resolve(__dirname, "./src/pages"),
                "@layout": path.resolve(__dirname, "./src/layout"),
                "@components": path.resolve(__dirname, "./src/components"),
                "@database": path.resolve(__dirname, "./src/database"),
            },
        },
        module: {
            rules: [
                {
                    test: /.(js|ts)x?$/,
                    exclude: /node_modules/,
                    loader: "babel-loader",
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"],
                },
                {
                    test: /\.svg$/,
                    use: ["@svgr/webpack", "url-loader"],
                },
                {
                    test: /\.(png|jpg|gif)$/i,
                    use: [
                        {
                            loader: "url-loader",
                            options: {
                                limit: 8192,
                            },
                        },
                    ],
                },
            ],
        },
        // Define Outputs
        target: "web",
        output: {
            filename: "bundle.js",
            path: path.resolve(__dirname, "dist"),
        },
        // Define Plugins
        plugins: [
            new ESLintWebpackPlugin({
                extensions: ["js", "jsx", "json", "ts", "tsx"],
                files: "src",
            }),
            new CleanWebpackPlugin(),
            new FaviconsWebpackPlugin(
                path.resolve(__dirname, "./src/assets/knight.svg")
            ),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, "./public/index.html"),
            }),
            new BarWebpackPlugin({}),
        ],
    },
];

export default config;
