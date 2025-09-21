import React from "react";
import "./Pagination.css";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	onPageChange,
}) => {
	const getPageNumbers = () => {
		const pages = [];
		const maxVisiblePages = 5;

		let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
		let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

		if (endPage - startPage + 1 < maxVisiblePages) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1);
		}

		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}

		return pages;
	};

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages && page !== currentPage) {
			onPageChange(page);
		}
	};

	if (totalPages <= 1) {
		return null;
	}

	const pageNumbers = getPageNumbers();

	return (
		<div className="pagination">
			<button
				onClick={() => handlePageChange(currentPage - 1)}
				disabled={currentPage === 1}
				className="pagination-button prev"
			>
				← Предыдущая
			</button>

			<div className="pagination-numbers">
				{pageNumbers[0] > 1 && (
					<>
						<button
							onClick={() => handlePageChange(1)}
							className="pagination-button"
						>
							1
						</button>
						{pageNumbers[0] > 2 && (
							<span className="pagination-ellipsis">...</span>
						)}
					</>
				)}

				{pageNumbers.map((page) => (
					<button
						key={page}
						onClick={() => handlePageChange(page)}
						className={`pagination-button ${
							currentPage === page ? "active" : ""
						}`}
					>
						{page}
					</button>
				))}

				{pageNumbers[pageNumbers.length - 1] < totalPages && (
					<>
						{pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
							<span className="pagination-ellipsis">...</span>
						)}
						<button
							onClick={() => handlePageChange(totalPages)}
							className="pagination-button"
						>
							{totalPages}
						</button>
					</>
				)}
			</div>

			<button
				onClick={() => handlePageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
				className="pagination-button next"
			>
				Следующая →
			</button>
		</div>
	);
};

export default Pagination;
