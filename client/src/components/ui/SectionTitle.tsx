import React from "react";

interface Props {
    title: string;
}

const SectionTitle: React.FC<Props> = ({ title }) => (
    <h1 className="text-3xl font-bold text-center text-indigo-700 mb-8">
        {title}
    </h1>
);

export default SectionTitle;
