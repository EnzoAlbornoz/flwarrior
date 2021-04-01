export default {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleNameMapper: {
        "@/(.*)": "<rootDir>/src/$1",
        "@assets/(.*)": "<rootDir>/src/assets/$1",
        "@pages/(.*)": "<rootDir>/src/pages/$1",
        "@layout": "<rootDir>/src/layout",
        "@layout/(.*)": "<rootDir>/src/layout/$1",
        "@components/(.*)": "<rootDir>/src/components/$1",
        "@database": "<rootDir>/src/database",
        "@database/(.*)": "<rootDir>/src/database/$1",
    },
};
